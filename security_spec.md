# Document: security_spec.md

## 1. Data Invariants
1. A profile document ID must strictly match the Auth UID.
2. A calculation cannot exist without a valid normalized inputs JSON and required fields.
3. Access to project scopes strictly relies on project memberships.

## 2. The Dirty Dozen Payloads
1. Create profile: user tries to spoof `userId`.
2. Create profile: profile with extra shadow fields.
3. Update profile: attempt to change `userId`.
4. Create calculation: missing calculation key.
5. Create calculation: `sharedScope` set to 'project' but missing `projectId`.
6. Read calculation: user trying to read someone else's private calculation.
7. List calculations: user lists calculations without filtering by `userId` or `projectId`.
8. Create company: owner ID spoofing.
9. Delete calculation: trying to delete another user's calculation.
10. Update company: change owner.
11. Update project membership: user elevates own role.
12. Create document: missing `scope`.

## 3. Test Runner 
Will be implemented in `firestore.rules.test.ts` or verified via ESLint.
