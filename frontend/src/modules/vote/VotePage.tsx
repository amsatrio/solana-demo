import { useState, useEffect, useMemo } from 'react';
import { useAnchorWallet, useConnection } from '@solana/wallet-adapter-react';
import { Program, AnchorProvider, type Idl } from '@coral-xyz/anchor';
import { useDispatch, useSelector } from 'react-redux';
import { createVote, updateVote, deleteVote, castVote, fetchAllVotes } from './voteSlice';
import idl from '../../../../backend/target/idl/vote.json';
import type { Vote } from "../../../../backend/target/types/vote";
import type { AppDispatch, RootState } from '../../store';

import {
    Container, Box, Typography, TextField, Button, CircularProgress,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Paper, Chip, IconButton, Dialog, DialogTitle, DialogContent,
    DialogActions, Stack, Tooltip
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import HowToVoteIcon from '@mui/icons-material/HowToVote'; // Better for "Voting"
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';

// 1. DEFINE YOUR ADMIN PUBLIC KEY HERE
const ADMIN_PUBKEY = "9dEkFh197y7scrxf5BfiEJ7HSFhnNYixECBt4H2cegZE";

export default function VotePage() {
    const { connection } = useConnection();
    const wallet = useAnchorWallet();

    const dispatch = useDispatch<AppDispatch>();
    const { items: votes, loading } = useSelector((state: RootState) => state.votes);

    // Check if the current user is the Admin
    const isAdmin = useMemo(() => {
        console.log(wallet?.publicKey.toBase58())
        return wallet?.publicKey.toBase58() === ADMIN_PUBKEY;
    }, [wallet]);

    const [formData, setFormData] = useState({ name: "" });
    const [selectedVote, setSelectedVote] = useState<any>(null);
    const [formModalOpen, setFormModalOpen] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [voteToDelete, setVoteToDelete] = useState<any>(null);

    const program = useMemo(() => {
        if (!wallet) return null;
        const provider = new AnchorProvider(connection, wallet, { commitment: 'confirmed' });
        return new Program(idl as Idl, provider) as Program<Vote>;
    }, [connection, wallet]);

    useEffect(() => {
        if (program && wallet) {
            dispatch(fetchAllVotes({ program }));
        }
    }, [program, wallet, dispatch]);

    const handleOpenForm = (vote: any = null) => {
        if (vote) {
            setSelectedVote(vote);
            setFormData({ name: vote.account.name });
        } else {
            setSelectedVote(null);
            setFormData({ name: "" });
        }
        setFormModalOpen(true);
    };

    const handleSubmit = async () => {
        if (!program || !wallet || !formData.name) return;
        if (selectedVote) {
            await dispatch(updateVote({
                program,
                userPublicKey: wallet.publicKey,
                name: formData.name,
                votePda: selectedVote.publicKey
            }));
        } else {
            await dispatch(createVote({
                program,
                userPublicKey: wallet.publicKey,
                ...formData
            }));
        }
        setFormModalOpen(false);
    };

    const handleDelete = async () => {
        if (!program || !wallet || !voteToDelete) return;
        await dispatch(deleteVote({
            program,
            userPublicKey: wallet.publicKey,
            votePda: voteToDelete.publicKey
        }));
        setDeleteModalOpen(false);
    };


    return (
        <Container maxWidth={false} sx={{ py: 4, px: { xs: 2, md: 6 }, minHeight: '100vh' }}>
            <Typography variant="h4" fontWeight="bold">Solana Voting App</Typography>

            <Box sx={{ mb: 4, mt: 2, display: 'flex', justifyContent: 'space-between' }}>
                <Chip
                    label={isAdmin ? "Logged in as Admin" : "Logged in as Voter"}
                    color={isAdmin ? "secondary" : "default"}
                />

                {/* ADMIN ONLY: Create Button */}
                {isAdmin && (
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => handleOpenForm()}
                    >
                        Create New Proposal
                    </Button>
                )}
            </Box>

            <TableContainer component={Paper}>
                <Table sx={{ minWidth: 650 }}>
                    <TableHead>
                        <TableRow>
                            <TableCell><strong>Status</strong></TableCell>
                            <TableCell><strong>Proposal Name</strong></TableCell>
                            <TableCell align="center"><strong>Votes Cast</strong></TableCell>
                            <TableCell align="right"><strong>Actions</strong></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading && votes.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} align="center"><CircularProgress /></TableCell>
                            </TableRow>
                        ) : (
                            votes.map((t) => (
                                <TableRow key={t.publicKey.toString()} hover>
                                    <TableCell>
                                        <Chip
                                            label={t.account.isActive ? "Active" : "Closed"}
                                            color={t.account.isActive ? "success" : "error"}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 500 }}>{t.account.name}</TableCell>
                                    <TableCell align="center">
                                        <Box sx={{
                                            display: 'inline-block',
                                            px: 2, py: 0.5,
                                            borderRadius: 2,
                                            fontWeight: 'bold'
                                        }}>
                                            {t.account.count?.toString() || "0"}
                                        </Box>
                                    </TableCell>
                                    <TableCell align="right">
                                        <Stack direction="row" spacing={1} justifyContent="flex-end">

                                            {/* EVERYONE: Cast Vote Button */}
                                            <Tooltip title="Cast Your Vote">
                                                <IconButton
                                                    color="success"
                                                    onClick={() => dispatch(castVote({
                                                        program: program!,
                                                        userPublicKey: wallet!.publicKey,
                                                        votePda: t.publicKey
                                                    }))}
                                                >
                                                    <HowToVoteIcon />
                                                </IconButton>
                                            </Tooltip>

                                            {/* ADMIN ONLY: Edit and Delete */}
                                            {isAdmin && (
                                                <>
                                                    <IconButton color="primary" onClick={() => handleOpenForm(t)}>
                                                        <EditIcon />
                                                    </IconButton>
                                                    <IconButton color="error" onClick={() => {
                                                        setVoteToDelete(t);
                                                        setDeleteModalOpen(true);
                                                    }}>
                                                        <DeleteIcon />
                                                    </IconButton>
                                                </>
                                            )}
                                        </Stack>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* MODALS (Only triggerable/visible to Admin via buttons above) */}
            <Dialog open={formModalOpen} onClose={() => setFormModalOpen(false)} fullWidth maxWidth="xs">
                <DialogTitle>{selectedVote ? "Edit Proposal" : "Create Proposal"}</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Proposal Name"
                        fullWidth
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setFormModalOpen(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleSubmit}>Save</Button>
                </DialogActions>
            </Dialog>

            <Dialog open={deleteModalOpen} onClose={() => setDeleteModalOpen(false)}>
                <DialogTitle>Delete Proposal?</DialogTitle>
                <DialogActions>
                    <Button onClick={() => setDeleteModalOpen(false)}>Cancel</Button>
                    <Button onClick={handleDelete} color="error" variant="contained">Delete</Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
}