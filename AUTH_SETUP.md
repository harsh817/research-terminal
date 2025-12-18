# Authentication Setup - Research Terminal

## Overview

The Research Terminal uses Supabase Authentication for secure user management. The authentication system integrates seamlessly with the entire application.

## Features

- **Email/Password Authentication**: Standard email and password signup and login
- **Automatic Profile Creation**: User profiles are automatically created when users sign up via auth triggers
- **Auth-Based Routing**: Automatic redirection based on authentication status
- **Session Management**: Automatic session persistence and token refresh
- **Logout Functionality**: Users can logout from the terminal header

## User Flow

### 1. Sign Up
- User navigates to `/auth/signup`
- Fills in Full Name, Email, and Password (min 8 characters)
- Form validates email format and password length
- On success, account is created and user is redirected to login
- Auth trigger automatically creates user profile in `users` table

### 2. Login
- User navigates to `/auth/login`
- Enters email and password
- On success, session is established and user is redirected to `/terminal`
- Invalid credentials show error message

### 3. Protected Routes
- Terminal routes are protected by `AuthProvider`
- Unauthenticated users are automatically redirected to `/auth/login`
- Authenticated users on auth pages are redirected to `/terminal`
- Public pages (landing page, help) are accessible to everyone

### 4. Logout
- Users click the logout icon in the terminal header
- Session is destroyed and user is redirected to `/auth/login`

## Technical Architecture

### Components

**Auth Context** (`lib/auth-context.tsx`)
- Manages global authentication state
- Provides `useAuth()` hook for components
- Handles automatic route protection
- Listens to auth state changes

**Auth Pages**
- `/auth/signup` - Registration page
- `/auth/login` - Login page
- Both pages validate form inputs and display errors

**Database Integration**
- Auth users stored in Supabase `auth.users` table
- User profiles stored in public `users` table
- Auth trigger function syncs auth users to profiles

## Form Validation

### Signup Validation
- Full Name: Required, non-empty
- Email: Required, valid email format (RFC 5322 simplified)
- Password: Required, minimum 8 characters

### Login Validation
- Email: Required, valid email format
- Password: Required, non-empty

### Error Handling
- Email already registered
- Invalid credentials
- Network errors
- Form validation errors shown in-field

## API Integration

### Signup Endpoint
```typescript
await supabase.auth.signUp({
  email,
  password,
  options: {
    data: { full_name: fullName }
  }
})
```

### Login Endpoint
```typescript
await supabase.auth.signInWithPassword({
  email,
  password
})
```

### Session Management
```typescript
// Get current session
const { data: { session } } = await supabase.auth.getSession()

// Listen to auth changes
supabase.auth.onAuthStateChange((event, session) => {
  // Handle auth state changes
})

// Sign out
await supabase.auth.signOut()
```

## Database Schema

### users table
```sql
CREATE TABLE users (
  id uuid PRIMARY KEY,
  email text UNIQUE NOT NULL,
  created_at timestamptz,
  updated_at timestamptz
);
```

### Auth Trigger
```sql
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, created_at, updated_at)
  VALUES (new.id, new.email, now(), now())
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
```

## Environment Variables

Required environment variables (set in `.env`):
```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

These are automatically configured by Supabase and read from your project settings.

## Security Features

1. **JWT Validation**: All requests validated against Supabase JWT
2. **Row Level Security**: Database tables protected with RLS policies
3. **Session Security**: HTTPS enforced in production
4. **Password Security**: Passwords never logged or stored in client
5. **Automatic Redirect**: Prevents access to protected resources
6. **CORS Protection**: Supabase handles CORS securely

## Testing the System

### Manual Testing Checklist

1. **Signup Flow**
   - [ ] Visit `/auth/signup`
   - [ ] Enter invalid email → see error
   - [ ] Enter short password → see error
   - [ ] Submit valid form → redirected to login
   - [ ] Try existing email → see "already registered" error

2. **Login Flow**
   - [ ] Visit `/auth/login`
   - [ ] Enter wrong password → see error
   - [ ] Enter valid credentials → redirected to terminal
   - [ ] Close browser → session persists

3. **Protected Routes**
   - [ ] Access `/terminal` logged out → redirected to login
   - [ ] Login → access terminal
   - [ ] Click logout → redirected to login

4. **Auth Persistence**
   - [ ] Login and refresh page → stay logged in
   - [ ] Clear cookies manually → logout on next page load

## Troubleshooting

### "Supabase not configured" error
- Check `.env` file has `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Verify values are correct from Supabase project settings
- Restart dev server after changing `.env`

### Users not appearing in database
- Verify auth trigger is created: `SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created'`
- Check trigger function exists: `SELECT * FROM pg_proc WHERE proname = 'handle_new_user'`
- Manually run trigger: `SELECT handle_new_user()`

### Infinite redirect loops
- Clear browser cookies
- Check auth context redirect logic
- Verify public pages list in `AuthProvider`

### Session doesn't persist
- Check browser cookies are enabled
- Verify localStorage is not blocked
- Check `persistSession: true` in Supabase client config

## Next Steps

1. Deploy authentication to production
2. Monitor failed login attempts
3. Implement password reset (optional)
4. Add email verification (optional)
5. Implement two-factor authentication (optional)
