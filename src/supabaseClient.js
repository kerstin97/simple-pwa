import { createClient } from "@supabase/supabase-js";

export const REACT_APP_SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
export const REACT_APP_SUPABASE_KEY = process.env.REACT_APP_SUPABASE_KEY;

export const supabase = createClient(
  REACT_APP_SUPABASE_URL,
  REACT_APP_SUPABASE_KEY
);
