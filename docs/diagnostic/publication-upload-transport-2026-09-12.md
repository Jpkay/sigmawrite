# Large diagnostic publication transport

Revision 38's publication envelope is about 20 MB. The original RPC timed out, then returned an infrastructure error; the Management API rejected a full SQL envelope with HTTP 413. Follow-up release lookups found no published revision 38.

The new service-only transport uploads at most 256 KiB of binary data per chunk. An upload identity pins its checksum, byte length and number of chunks. Retries may repeat identical chunks, but cannot replace them. The database reassembles the bytes in order, verifies the complete checksum and length, and only then decodes the JSON envelope.

Finalization calls the existing `publish_granular_parallel_release` function. Its administrator authorization, approved parent checks, locked relational bank comparison, publication preflight and immutable release conflict checks still apply. A rejected publication leaves the upload uncompleted. The regular application loader must verify the resulting release before the operator reports success.

Validation: three TypeScript tests passed; PostgreSQL 17 tests covered incomplete upload rejection, conflicting metadata and chunks, identical retries, checksum rejection, exact payload forwarding, failed publisher rollback, completed retry behavior and role permissions. The database fixture substitutes a rejecting/accepting publisher to test the transport boundary; it does not substitute for live canonical-bank verification. TypeScript compilation passed.

Migration `20260912190000_granular_publication_uploads.sql` was applied to the linked Plume database and recorded in migration history. This does not enable the separate full-material-history contract. The revision 38 live upload completed: 20,673,605 bytes in 79 chunks, checked against checksum `sha256:de5d70a467b5cab1124b888abc26f82237d9dc6b7aef1ed2a5d9fab1932f49d5`. The existing publisher created release `e203adcd-b218-46f6-95a6-559ee49abf7b`; the normal loader verified bundle checksum `sha256:10ed36543182eef7aca833747cd065eec97b6cefddf87b7e9ca040e4def1f69c`. Public activation is a separate step.
