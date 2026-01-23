use anchor_lang::prelude::*;

declare_id!("HYSgH9tCnpkZ1h2MrcSf6773jx36CiPYe4L3DmAdQYko");

pub const ACHOR_DISCRIMINATOR_SIZE: usize = 8;

#[program]
pub mod todo {
    use super::*;

    // CREATE
    pub fn create_todo(ctx: Context<CreateTodo>, title: String, description: String) -> Result<()> {
        let todo = &mut ctx.accounts.todo;
        let clock = Clock::get()?;

        todo.owner = *ctx.accounts.user.key;
        todo.title = title;
        todo.description = description;
        todo.is_active = true;
        todo.created_on = clock.unix_timestamp;
        todo.modified_on = clock.unix_timestamp;
        Ok(())
    }

    // UPDATE (Toggle Active or Change Content)
    pub fn update_todo(ctx: Context<UpdateTodo>, title: Option<String>, description: Option<String>, is_active: Option<bool>) -> Result<()> {
        let todo = &mut ctx.accounts.todo;
        let clock = Clock::get()?;

        if let Some(t) = title { todo.title = t; }
        if let Some(d) = description { todo.description = d; }
        if let Some(a) = is_active { todo.is_active = a; }
        
        todo.modified_on = clock.unix_timestamp;
        Ok(())
    }

    // DELETE (Closes the account and sends lamports back to user)
    pub fn delete_todo(_ctx: Context<DeleteTodo>) -> Result<()> {
        Ok(())
    }
}

// --- Account Architectures ---

#[derive(Accounts)]
#[instruction(title: String)]
pub struct CreateTodo<'info> {
    #[account(
        init, 
        payer = user, 
        space = ACHOR_DISCRIMINATOR_SIZE + TodoState::INIT_SPACE
        seeds = [b"todo", user.key().as_ref(), title.as_bytes()], 
        bump
    )]
    pub todo: Account<'info, TodoState>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateTodo<'info> {
    #[account(mut, has_one = owner)]
    pub todo: Account<'info, TodoState>,
    pub owner: Signer<'info>,
}

#[derive(Accounts)]
pub struct DeleteTodo<'info> {
    #[account(mut, has_one = owner, close = owner)]
    pub todo: Account<'info, TodoState>,
    pub owner: Signer<'info>,
}

#[account]
#[derive(InitSpace)]
pub struct TodoState {
    pub owner: Pubkey,      // 32 bytes
    #[max_len(50)]
    pub title: String,      // ~50 bytes
    #[max_len(200)]
    pub description: String, // ~200 bytes
    pub is_active: bool,    // 1 byte
    pub created_on: i64,    // 8 bytes
    pub modified_on: i64,   // 8 bytes
}
