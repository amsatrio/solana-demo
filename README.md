# Solana Demo

# Favorites
```rs
use anchor_lang::prelude::*;

declare_id!("EiRQCWQpWDBUfwrCFTnACuxj8YsFgKQp7jA42yKhKJM1");

pub const ACHOR_DISCRIMINATOR_SIZE: usize = 8;

#[program]
pub mod favorites {
    use super::*;
    pub fn set_favorites(
        context: Context<SetFavorites>,
        number: u64,
        color: String,
        hobbies: Vec<String>,
    ) -> Result<()> {
        msg!("Greetings from {}", context.program_id);
        let _user_public_key = context.accounts.user.key();
        msg!("User {}", _user_public_key);
        context.accounts.favorites.set_inner(Favorites {
            number,
            color,
            hobbies,
        });
        Ok(())
    }
}

#[account]
#[derive(InitSpace)]
pub struct Favorites {
    pub number: u64,
    #[max_len(50)]
    pub color: String,
    #[max_len(5, 50)]
    pub hobbies: Vec<String>,
}

#[derive(Accounts)]
pub struct SetFavorites<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        init_if_needed,
        payer = user,
        space = ACHOR_DISCRIMINATOR_SIZE + Favorites::INIT_SPACE,
        seeds = [b"favorites", user.key().as_ref()],
        bump
    )]
    pub favorites: Account<'info, Favorites>,
    pub system_program: Program<'info, System>,
}

```


# resources
youtube: https://www.youtube.com/watch?v=amAq-WHAFs8




# ============================================================

## backend - anchor
```anchor init <anchor-name>```
anchor init backend

cd backend
anchor build

### test
use this:
solana-keygen new --no-bip39-passphrase -o target/deploy/todo-keypair.json --force
anchor keys sync
anchor build
anchor test
or:
solana-test-validator
solana config set --url localhost
anchor build
solana airdrop 10
anchor deploy
anchor test --skip-local-validator

## frontend - react
yarn create vite frontend --template react-ts

yarn add @coral-xyz/anchor @solana/web3.js @solana/wallet-adapter-react @solana/wallet-adapter-react-ui @solana/wallet-adapter-base @solana/wallet-adapter-wallets

yarn add @mui/material @emotion/react @emotion/styled @mui/icons-material
