import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Link } from "react-router-dom";

export default function HomePage() {
    const { connected } = useWallet();
    if (!connected) {
        return <div><WalletMultiButton /></div>;
    }

    return (
        <div>
            <WalletMultiButton />
            <br/>
            <Link to="/todo">todo</Link>
            <br />
            <Link to="/vote">vote</Link>
        </div>
    )
}