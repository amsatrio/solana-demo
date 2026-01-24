import { useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import TodoPage from './modules/todo/TodoPage';
import { ThemeProvider, createTheme } from '@mui/material/styles';

export const App = () => {
    // The network can be set to 'devnet', 'testnet', or 'mainnet'
    // const network = WalletAdapterNetwork.Devnet;
    // const endpoint = useMemo(() => clusterApiUrl(network), [network]);

    // local
    const endpoint = useMemo(() => "http://127.0.0.1:8899", []);

    const theme = createTheme({
        colorSchemes: {
            dark: true,
        },
    });
    return (
        <ThemeProvider theme={theme}>
            <ConnectionProvider endpoint={endpoint}>
                <WalletProvider wallets={[]} autoConnect>
                    <WalletModalProvider>
                        <TodoPage />
                    </WalletModalProvider>
                </WalletProvider>
            </ConnectionProvider>
        </ThemeProvider>
    );
};