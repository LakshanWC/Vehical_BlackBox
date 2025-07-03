import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    TextField,
    Button,
    Box,
    Typography,
    Paper,
    Container,
    CssBaseline // Add CssBaseline to normalize styles
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (username === 'admin' && password === 'admin123') {
                localStorage.setItem('isAuthenticated', 'true');
                navigate('/dashboard');
            } else {
                setError('Invalid credentials');
            }
        } catch (err) {
            setError('Login failed');
        }
    };

    return (
        <Box
            sx={{
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #1a2a6c, #b21f1f)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                py: 4
            }}
        >
            <CssBaseline /> {/* Normalize background styles */}
            <Container component="main" maxWidth="xs">
                <Paper
                    elevation={10}
                    sx={{
                        p: 4,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        borderRadius: 2,
                        transition: 'transform 0.3s',
                        '&:hover': {
                            transform: 'scale(1.02)'
                        }
                    }}
                >
                    <Box sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        mb: 3
                    }}>
                        <LockOutlinedIcon sx={{
                            fontSize: 40,
                            color: 'primary.main',
                            mb: 2
                        }} />
                        <Typography component="h1" variant="h5">
                            IoT Accident Detection
                        </Typography>
                    </Box>

                    {error && (
                        <Typography color="error" sx={{ mb: 2 }}>
                            {error}
                        </Typography>
                    )}

                    <Box
                        component="form"
                        onSubmit={handleSubmit}
                        sx={{ width: '100%' }}
                    >
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            label="Username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            label="Password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            sx={{ mt: 3, mb: 2, py: 1.5 }}
                        >
                            Sign In
                        </Button>
                    </Box>
                </Paper>
            </Container>
        </Box>
    );
};

export default Login;