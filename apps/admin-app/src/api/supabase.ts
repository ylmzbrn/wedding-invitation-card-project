import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';


const supabaseUrl = 'https://pmxpjyutzrhzlyuilfxo.supabase.co';
const supabaseAnonKey = 'sb_publishable_zganpgPp2LSdcNVyj4b-zA_8NjYaVMh';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);