use anchor_lang::prelude::*;
declare_id!("6E7BxM2i1XEo35Dj9wUzwkxKCWp9ssbGMQ1FjyNzTk55");

pub const ACHOR_DISCRIMINATOR_SIZE: usize = 8;

// --- main program ---

#[program]
pub mod vote {
    use super::*;

    pub fn create_vote(ctx: Context<CreateVote>, name: String) -> Result<()> {
        let vote = &mut ctx.accounts.vote;
        let clock = Clock::get()?;

        vote.owner = *ctx.accounts.admin.key;
        vote.name = name;
        vote.count = 0;
        vote.created_on = clock.unix_timestamp;
        vote.modified_on = 0;
        Ok(())
    }

    pub fn update_vote(ctx: Context<UpdateVote>, name: Option<String>) -> Result<()> {
        let vote = &mut ctx.accounts.vote;
        let clock = Clock::get()?;
        
        if let Some(t) = name { vote.name = t; }

        vote.modified_on = clock.unix_timestamp;
        Ok(())
    }

    pub fn cast_vote(ctx: Context<CastVote>) -> Result<()> {
        let clock = Clock::get()?;
        let vote = &mut ctx.accounts.vote;
        
        // The logic here only executes if the PDA doesn't exist yet
        // because of the `init` constraint in the context below.
        vote.count += 1;
        vote.modified_on = clock.unix_timestamp;

        Ok(())
    }

    pub fn delete_vote(_ctx: Context<DeleteVote>) -> Result<()> {
        Ok(())
    }
}

// --- account architecture ---

#[derive(Accounts)]
#[instruction(name: String)]
pub struct CreateVote<'info> {
    #[account(
        init, 
        payer = admin,
        space = ACHOR_DISCRIMINATOR_SIZE + VoteState::INIT_SPACE,
        seeds = [b"vote", admin.key().as_ref(), name.as_bytes()],
        bump,
    )]
    pub vote: Account<'info, VoteState>,
    #[account(mut)]
    pub admin: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateVote<'info> {
    #[account(mut, has_one = owner)]
    pub vote: Account<'info, VoteState>,
    pub owner: Signer<'info>,
}

#[derive(Accounts)]
pub struct CastVote<'info> {
    #[account(mut)]
    pub vote: Account<'info, VoteState>,

    // This PDA acts as a "receipt". 
    // If this wallet already voted for this specific vote PDA, 
    // the transaction will fail during initialization.
    #[account(
        init,
        payer = user,
        space = ACHOR_DISCRIMINATOR_SIZE + VoteReceipt::INIT_SPACE,
        seeds = [b"receipt", vote.key().as_ref(), user.key().as_ref()],
        bump
    )]
    pub vote_receipt: Account<'info, VoteReceipt>,

    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct DeleteVote<'info> {
    #[account(mut, has_one = owner, close = owner)]
    pub vote: Account<'info, VoteState>,
    pub owner: Signer<'info>,
}

// --- state ---

#[account]
#[derive(InitSpace)]
pub struct VoteState {
    pub owner: Pubkey,
    #[max_len(50)]
    pub name: String,
    pub count: u64,
    pub created_on: i64,
    pub modified_on: i64,
}

#[account]
#[derive(InitSpace)]
pub struct VoteReceipt {
    // We don't necessarily need to store data, 
    // the existence of the account is the proof.
}