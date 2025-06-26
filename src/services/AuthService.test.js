import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import axios from 'axios';
import { login, register, API_URL } from './AuthService.js';

const email = 'user@example.com';
const password = 'secret';


test('login calls API and returns data', async () => {
  const responseData = { token: 'abc' };
  const postMock = mock.method(axios, 'post', async () => ({ data: responseData }));

  const result = await login(email, password);

  assert.deepEqual(result, responseData);
  assert.equal(postMock.mock.calls.length, 1);
  assert.equal(postMock.mock.calls[0].arguments[0], `${API_URL}/auth/login`);
  assert.deepEqual(postMock.mock.calls[0].arguments[1], { email, password });
});

test('login throws error message on failure', async () => {
  const error = { response: { data: { message: 'invalid credentials' } } };
  mock.method(axios, 'post', async () => { throw error; });

  await assert.rejects(() => login(email, password), /invalid credentials/);
});

test('register calls API and returns data', async () => {
  const responseData = { id: 1 };
  const postMock = mock.method(axios, 'post', async () => ({ data: responseData }));

  const result = await register(email, password);

  assert.deepEqual(result, responseData);
  assert.equal(postMock.mock.calls.length, 1);
  assert.equal(postMock.mock.calls[0].arguments[0], `${API_URL}/auth/register`);
  assert.deepEqual(postMock.mock.calls[0].arguments[1], { email, password });
});

test('register throws error message on failure', async () => {
  const error = { response: { data: { message: 'erro ao registrar' } } };
  mock.method(axios, 'post', async () => { throw error; });

  await assert.rejects(() => register(email, password), /erro ao registrar/);
});
