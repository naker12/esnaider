# Security Spec — Crónicas del Velo Firestore Rules

## 1. Data Invariants
- Every document in `/players/{userId}` MUST belong strictly to `request.auth.uid == userId`, with `uid == userId`, verified email (`request.auth.token.email_verified == true`), zero PII fields, bounded integers (`level` in `1..9999`, `gold >= 0`, `kills >= 0`, `rebirths >= 0`), optional valid clan fields (`clanName`, `clanTag`, `clanColor`), and immutable `uid` + `createdAt`.
- Every document in `/leaderboard/{userId}` MUST contain zero PII (`uid`, `playerName`, optional `clanName`/`clanTag`/`clanColor`, `titleName`, `raceId`, `classId`, `difficultyId`, `gold`, `kills`, `level`, `rebirths`, `createdAt`, `updatedAt`), be readable by signed-in users with `allow list` verifying `resource.data` fields explicitly, and be writable ONLY by the matching verified owner `request.auth.uid == userId`.
- Every document in `/online_players/{userId}` represents real-time multiplayer coordinates and clan badge (`mapId` in `['plaza', 'templo']`, bounded coordinates `x, z in -300..300`), readable by signed-in users, and writable ONLY by verified owner `request.auth.uid == userId` with `updatedAt == request.time`.
- Every document in `/chat_messages/{messageId}` is an immutable chat message (`text` `1..240` chars, `channel` in `['global', 'clan']`, `mapId` in `['plaza', 'templo']`, clan tag/color/name) readable by signed-in users, creatable ONLY by verified user with `uid == request.auth.uid` and `createdAt == request.time`, never updatable, and deletable only by its author.
- All other paths fall under the default-deny catch-all `match /{document=**} { allow read, write: if false; }`.

## 2. Adversarial Test Vectors ("Dirty Dozen")
1. **Unauthenticated read/write on `/players/{uid}`, `/online_players/{uid}`, or `/chat_messages/{id}`** -> `PERMISSION_DENIED`.
2. **Cross-user write on `/players/{otherUid}` or `/online_players/{otherUid}`** -> `PERMISSION_DENIED`.
3. **Unverified email write on `/players/{uid}`, `/online_players/{uid}`, or `/chat_messages/{id}`** -> `PERMISSION_DENIED`.
4. **Shadow/ghost field (`isAdmin: true`) injected on create** -> `PERMISSION_DENIED` (`hasOnly`).
5. **Shadow/ghost field injected on update** -> `PERMISSION_DENIED` (`affectedKeys().hasOnly(...)`).
6. **Spoofed `uid` mismatch (`incoming().uid != request.auth.uid`)** -> `PERMISSION_DENIED`.
7. **Out-of-bounds `level: 10000` (> 9999) or `x: 9999`** -> `PERMISSION_DENIED`.
8. **Negative `gold: -50` or `kills: -1` or `rebirths: -1`** -> `PERMISSION_DENIED`.
9. **Oversized `playerName` (> 24 chars), invalid `mapId`, or oversized chat `text` (> 240 chars)** -> `PERMISSION_DENIED`.
10. **Client-spoofed `createdAt` or `updatedAt != request.time`** -> `PERMISSION_DENIED`.
11. **Attempt to update an immutable chat message in `/chat_messages/{id}`** -> `PERMISSION_DENIED`.
12. **PII field (`email: "x@y.com"`) injected in `/leaderboard/{uid}`, `/online_players/{uid}`, or `/chat_messages/{id}`** -> `PERMISSION_DENIED`.
