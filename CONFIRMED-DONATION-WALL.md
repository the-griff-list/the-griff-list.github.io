# Confirmed Donation Wall

Apply `confirmed-donation-wall.sql` in Supabase to enable the public Supporter Wall and the private admin's manual confirmed-donation entry form.

- Visitors can read only rows where `confirmed = true`.
- Only the designated admin UUID can insert, edit, or delete rows.
- Public entries contain display name/alias, amount in CAD, and an optional requested song.
- Use Anonymous Rocker unless the supporter has explicitly agreed to public display.
- Do not enter transaction IDs, private email addresses, bank details, or other sensitive information.
- Add a record only after confirming the payment in the actual payment provider or bank. This manual wall is a curated display and is not payment verification.
