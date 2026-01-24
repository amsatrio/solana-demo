use anchor_lang::prelude::*;
declare_id!("H4gAgsRenNQQS5TnkbCaLE24hpPNe5YLL1sKtrqupq6z");

pub const ACHOR_DISCRIMINATOR_SIZE: usize = 8;

// --- main program ---

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
		todo.modified_on = 0;
		return Ok(());
	}
	// UPDATE
	pub fn update_todo(ctx: Context<UpdateTodo>, title: Option<String>, description: Option<String>, is_active: Option<bool>) -> Result<()> {
		let todo = &mut ctx.accounts.todo;
		let clock = Clock::get()?;
		
		if let Some(t) = title { todo.title = t; }
		if let Some(d) = description { todo.description = d; }
		if let Some(a) = is_active { todo.is_active = a; }

		todo.modified_on = clock.unix_timestamp;
		return Ok(());
	}
	// DELETE
	pub fn delete_todo(_ctx: Context<DeleteTodo>) -> Result<()> {
		return Ok(());
	}
}

// --- account architecture ---

#[derive(Accounts)]
#[instruction(title: String)]
pub struct CreateTodo<'info> {
	#[account(
		init, 
		payer = user,
		space = ACHOR_DISCRIMINATOR_SIZE + TodoState::INIT_SPACE,
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

// --- state ---

#[account]
#[derive(InitSpace)]
pub struct TodoState {
	pub owner: Pubkey,
	#[max_len(50)]
	pub title: String,
	#[max_len(200)]
	pub description: String,
	pub is_active: bool,
	pub created_on: i64,
	pub modified_on: i64,
}
