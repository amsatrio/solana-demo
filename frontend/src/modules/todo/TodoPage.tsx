import { useState, useEffect, useMemo } from 'react';
import { useAnchorWallet, useConnection } from '@solana/wallet-adapter-react';
import { Program, AnchorProvider, type Idl } from '@coral-xyz/anchor';
import { useDispatch, useSelector } from 'react-redux';
import { fetchTodos, createTodo, updateTodo, deleteTodo } from './todoSlice';
import idl from '../../../../backend/target/idl/todo.json';
import type { Todo } from "../../../../backend/target/types/todo";
import type { AppDispatch, RootState } from '../../store';

import {
    Container, Box, Typography, TextField, Button, CircularProgress,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Paper, Chip, IconButton, Dialog, DialogTitle, DialogContent,
    DialogActions, Stack, Tooltip
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import UndoIcon from '@mui/icons-material/Undo';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';

export default function TodoPage() {
    const { connection } = useConnection();
    const wallet = useAnchorWallet();
    const dispatch = useDispatch<AppDispatch>();
    const { items: todos, loading } = useSelector((state: RootState) => state.todos);

    // Form State
    const [formData, setFormData] = useState({ title: "", description: "" });
    const [selectedTodo, setSelectedTodo] = useState<any>(null);

    // Modal States
    const [formModalOpen, setFormModalOpen] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [todoToDelete, setTodoToDelete] = useState<any>(null);

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

    // Handlers
    const handleOpenForm = (todo: any = null) => {
        if (todo) {
            setSelectedTodo(todo);
            setFormData({ title: todo.account.title, description: todo.account.description });
        } else {
            setSelectedTodo(null);
            setFormData({ title: "", description: "" });
        }
        setFormModalOpen(true);
    };

    const handleSubmit = async () => {
        if (!program || !wallet || !formData.title) return;

        if (selectedTodo) {
            await dispatch(updateTodo({
                program,
                userPublicKey: wallet.publicKey,
                ...formData,
                todoPda: selectedTodo.publicKey,
                currentStatus: selectedTodo.account.isActive
            }));
        } else {
            await dispatch(createTodo({
                program,
                userPublicKey: wallet.publicKey,
                ...formData
            }));
        }
        setFormModalOpen(false);
    };

    const confirmDelete = (todo: any) => {
        setTodoToDelete(todo);
        setDeleteModalOpen(true);
    };

    const handleDelete = async () => {
        if (!program || !wallet || !todoToDelete) return;
        await dispatch(deleteTodo({
            program,
            userPublicKey: wallet.publicKey,
            todoPda: todoToDelete.publicKey
        }));
        setDeleteModalOpen(false);
        setTodoToDelete(null);
    };

    return (
        <Container sx={{ py: 4, px: { xs: 2, md: 6 }, minHeight: '100vh', width: '100%' }}>
            <Typography variant="h4" fontWeight="bold">Solana Todo Manager</Typography>
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>

                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpenForm()}
                >
                    New Task
                </Button>
            </Box>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell><strong>Status</strong></TableCell>
                            <TableCell><strong>Title</strong></TableCell>
                            <TableCell><strong>Description</strong></TableCell>
                            <TableCell align="right"><strong>Actions</strong></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading && todos.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                                    <CircularProgress size={30} />
                                    <Typography variant="body2" sx={{ mt: 1 }}>Syncing with Blockchain...</Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            todos.map((t) => (
                                <TableRow key={t.publicKey.toString()} hover>
                                    <TableCell>
                                        <Chip
                                            label={t.account.isActive ? "Active" : "Done"}
                                            color={t.account.isActive ? "warning" : "success"}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 500 }}>{t.account.title}</TableCell>
                                    <TableCell>{t.account.description}</TableCell>
                                    <TableCell align="right">
                                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                                            <Tooltip title={t.account.isActive ? "Mark as Done" : "Undo"}>
                                                <IconButton
                                                    color={t.account.isActive ? "success" : "warning"}
                                                    onClick={() => dispatch(updateTodo({
                                                        program: program!,
                                                        userPublicKey: wallet!.publicKey,
                                                        todoPda: t.publicKey,
                                                        title: null,
                                                        description: null,
                                                        currentStatus: t.account.isActive
                                                    }))}
                                                >
                                                    {t.account.isActive ? <CheckCircleIcon /> : <UndoIcon />}
                                                </IconButton>
                                            </Tooltip>
                                            <IconButton color="primary" onClick={() => handleOpenForm(t)}>
                                                <EditIcon />
                                            </IconButton>
                                            <IconButton color="error" onClick={() => confirmDelete(t)}>
                                                <DeleteIcon />
                                            </IconButton>
                                        </Stack>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* CREATE / UPDATE MODAL */}
            <Dialog open={formModalOpen} onClose={() => setFormModalOpen(false)} fullWidth maxWidth="xs">
                <DialogTitle>{selectedTodo ? "Edit Task" : "Create New Task"}</DialogTitle>
                <DialogContent>
                    <Stack spacing={3} sx={{ mt: 1 }}>
                        <TextField
                            label="Title"
                            fullWidth
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        />
                        <TextField
                            label="Description"
                            fullWidth
                            multiline
                            rows={3}
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={() => setFormModalOpen(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleSubmit} disabled={loading}>
                        {selectedTodo ? "Save Changes" : "Create Task"}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* DELETE CONFIRMATION MODAL */}
            <Dialog open={deleteModalOpen} onClose={() => setDeleteModalOpen(false)}>
                <DialogTitle>Confirm Deletion</DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to delete <strong>{todoToDelete?.account.title}</strong>?
                        This action costs gas and cannot be undone on the blockchain.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setDeleteModalOpen(false)}>Cancel</Button>
                    <Button onClick={handleDelete} color="error" variant="contained">
                        Delete Forever
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
}