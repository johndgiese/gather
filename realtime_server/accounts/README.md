# ACCOUNTS module
The accounts module handles authentication with various forms of accounts that
may be associated with a player.  and possibly many "accounts" tables that link
the player with various forms of login (e.g. twitter, Facebook, standard
email/password etc.)

## Accounts tables
Will hold login-specific details, and will have a foreign key pointing to a
player.  There will be a table for each type of login, but any given player
will only have at most one row in each account table.
