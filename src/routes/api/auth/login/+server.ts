import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { DatabaseService } from '$lib/database/connection';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '$lib/utils/config';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { email, password } = await request.json();

		// Validate input
		if (!email || !password) {
			return error(400, 'Email and password are required');
		}

		// Get user from database
		const user = await DatabaseService.getUserByEmail(email);
		if (!user) {
			return error(401, 'Invalid credentials');
		}

		// Check if user is active
		if (!user.is_active) {
			return error(401, 'Account is deactivated');
		}

		// Verify password
		const isValidPassword = await bcrypt.compare(password, (user as any).password_hash);
		if (!isValidPassword) {
			return error(401, 'Invalid credentials');
		}

		// Generate JWT token
		const token = jwt.sign(
			{ 
				userId: user.id, 
				email: user.email, 
				role: user.role 
			},
			config.jwt.secret,
			{ expiresIn: config.jwt.expiresIn }
		);

		// Update last login
		const { query } = await import('$lib/database/connection');
		await query(
			'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
			[user.id]
		);

		// Return user data (without password)
		const { password_hash, ...userWithoutPassword } = user;

		return json({
			success: true,
			user: userWithoutPassword,
			token
		});

	} catch (err) {
		console.error('Login error:', err);
		return error(500, 'Internal server error');
	}
};
