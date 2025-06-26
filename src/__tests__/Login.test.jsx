import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import Login from '../features/login/Login';
import * as AuthService from '../services/AuthService';

vi.mock('../services/AuthService');

describe('Login', () => {
  it('submits credentials and navigates to /home', async () => {
    const loginMock = AuthService.login.mockResolvedValue({});

    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/home" element={<div>Home Page</div>} />
        </Routes>
      </MemoryRouter>
    );

    await userEvent.type(screen.getByPlaceholderText(/email/i), 'test@example.com');
    await userEvent.type(screen.getByPlaceholderText(/senha/i), 'password');
    await userEvent.click(screen.getByRole('button', { name: /entrar/i }));

    expect(loginMock).toHaveBeenCalledWith('test@example.com', 'password');
    expect(screen.getByText('Home Page')).toBeInTheDocument();
  });
});
