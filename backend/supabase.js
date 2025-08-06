
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY 
const supabase = createClient(supabaseUrl, supabaseKey)




/**
 * Sign up a new user and insert user info into the "users" table
 * @param {string} email - User's email address
 * @param {string} password - User's password
 * @param {string} firstName - User's first name
 * @param {string} lastName - User's last name
 * @returns {Promise<{user: object|null, error: object|null}>}
 */
async function signUp(email, password, firstName, lastName) {
  // 1. Create user with Supabase Auth
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
  })

  if (signUpError) {
    console.error('Sign up error:', signUpError.message)
    return { user: null, error: signUpError }
  }

  const user = signUpData.user

  // 2. Insert user info into "users" table
  const { error: dbError } = await supabase.from('users').insert([
    {
      id: user.id,
      email: user.email,
      firstName,
      lastName,
    },
  ])

  if (dbError) {
    console.error('Database insert error:', dbError.message)
    return { user: null, error: dbError }
  }

  return { user, error: null }
}

export { signUp }
export default supabase