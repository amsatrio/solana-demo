import { useState, useEffect, useMemo } from 'react';
import { useAnchorWallet, useConnection } from '@solana/wallet-adapter-react';
import { Program, AnchorProvider, type Idl } from '@coral-xyz/anchor';
import { useDispatch, useSelector } from 'react-redux';
import { fetchTodos, createTodo, toggleTodo, deleteTodo } from './todoSlice';
import idl from '../../../../backend/target/idl/todo.json';
import type { Todo } from "../../../../backend/target/types/todo";
import type { AppDispatch, RootState } from '../../store';
import { Container, Box, Typography, TextField, Button, CircularProgress, Divider, Stack, Card, CardContent, Chip, IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import UndoIcon from '@mui/icons-material/Undo';

export default function TodoPage() {
    const { connection } = useConnection();
    const wallet = useAnchorWallet();
    const dispatch = useDispatch<AppDispatch>();
    const { items: todos, loading } = useSelector((state: RootState) => state.todos);

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");

    const program = useMemo(() => {
        if (!wallet) return null;
        const provider = new AnchorProvider(connection, wallet, { commitment: 'confirmed' });
        return new Program(idl as Idl, provider) as Program<Todo>;
    }, [connection, wallet]);

    useEffect(() => {
        if (program && wallet) {
            dispatch(fetchTodos({ program, userPublicKey: wallet.publicKey }));
        }
    }, [program, wallet, dispatch]);

    const handleCreate = async () => {
        if (!program || !wallet || !title) return;
        await dispatch(createTodo({ program, userPublicKey: wallet.publicKey, title, description }));
        setTitle("");
        setDescription("");
    };

    return (
        <Container maxWidth="sm" sx={{ mt: 4, mb: 4 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Typography variant="h4" component="h2" gutterBottom>
                    Solana Todo (RTK)
                </Typography>

                <TextField
                    label="Task Title"
                    variant="outlined"
                    fullWidth
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                />

                <TextField
                    label="Task Description"
                    variant="outlined"
                    fullWidth
                    multiline
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                />

                <Button
                    variant="contained"
                    size="large"
                    onClick={handleCreate}
                    disabled={loading}
                    startIcon={loading && <CircularProgress size={20} color="inherit" />}
                >
                    {loading ? "Processing..." : "Add Task"}
                </Button>

                <Divider sx={{ my: 2 }} />

                {loading && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CircularProgress size={24} />
                        <Typography variant="body2">Loading blockchain data...</Typography>
                    </Box>
                )}

                <Stack spacing={2}>
                    {todos.map((t) => (
                        <Card key={t.publicKey.toString()} variant="outlined" sx={{ borderRadius: 2 }}>
                            <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Box>
                                    <Typography variant="h6">{t.account.title}</Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {t.account.description}
                                    </Typography>
                                    <Chip
                                        label={t.account.isActive ? "Active" : "Completed"}
                                        size="small"
                                        color={t.account.isActive ? "warning" : "success"}
                                        sx={{ mt: 1 }}
                                    />
                                </Box>

                                <Stack direction="row" spacing={1}>
                                    <Button
                                        variant="outlined"
                                        color={t.account.isActive ? "warning" : "success"}
                                        startIcon={t.account.isActive ? <CheckCircleIcon /> : <UndoIcon />}
                                        onClick={() => dispatch(toggleTodo({
                                            program: program!,
                                            userPublicKey: wallet!.publicKey,
                                            todoPda: t.publicKey,
                                            currentStatus: t.account.isActive
                                        }))}
                                    >
                                        {t.account.isActive ? "Done" : "Undo"}
                                    </Button>

                                    <IconButton
                                        color="error"
                                        onClick={() => dispatch(deleteTodo({
                                            program: program!,
                                            userPublicKey: wallet!.publicKey,
                                            todoPda: t.publicKey
                                        }))}
                                    >
                                        <DeleteIcon />
                                    </IconButton>
                                </Stack>
                            </CardContent>
                        </Card>
                    ))}
                </Stack>
            </Box>
        </Container>
    );
}