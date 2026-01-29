import { useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import { RouterProvider } from 'react-router-dom';
import router from './router';

export const App = () => {
    // The network can be set to 'devnet', 'testnet', or 'mainnet'
    // const network = WalletAdapterNetwork.Devnet;
    // const endpoint = useMemo(() => clusterApiUrl(network), [network]);

    // local
    const endpoint = useMemo(() => "http://127.0.0.1:8899", []);

    const wallets = useMemo(
        () => [
            new PhantomWalletAdapter(),
            new SolflareWalletAdapter(),
        ],
        []
    );

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
                        <RouterProvider router={router} />
                    </WalletModalProvider>
                </WalletProvider>
            </ConnectionProvider>
        </ThemeProvider>
    );
};