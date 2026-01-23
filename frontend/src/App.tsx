import { useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import TodoPage from './modules/todo/TodoPage';
import { ThemeProvider, createTheme } from '@mui/material/styles';

export const App = () => {
    // const endpoint = clusterApiUrl('devnet');
    const endpoint = "http://127.0.0.1:8899";
    const wallets = useMemo(() => [new PhantomWalletAdapter()], []);

    const theme = createTheme({
        colorSchemes: {
            dark: true,
        },
    });
    return (
        <ThemeProvider theme={theme}>
            <ConnectionProvider endpoint={endpoint}>
                <WalletProvider wallets={wallets} autoConnect>
                    <WalletModalProvider>
                        <TodoPage />
                    </WalletModalProvider>
                </WalletProvider>
            </ConnectionProvider>
        </ThemeProvider>
    );
};