# Avoid a redundant bank load on empty start screens

The live 158-target release's paused start screen took 29.4 seconds to open and 18.7 seconds to reload in one check. A browser request comparison measured 22.6 seconds through the public domain and 21.8 seconds through the candidate URL. Both included a diagnostic POST taking about 15.5 seconds. These samples do not establish that the proxy caused the delay.

A direct store measurement loaded the release and recorded exposure history in roughly 3.3–3.5 seconds. The history lookup contained 416 keys, requiring only one batch. This does not explain the whole browser delay.

`recordMaterialDelivery` then performed another session and bank load even when the response contained no question, independent-check question or lesson. The helper now returns after validating that empty view shape. Authentication and initial release checks remain in the action. Responses carrying actual material, including paused responses with a question, retain the existing source validation and receipt writes.

Two paired measurements against the stable technical QA session measured this otherwise empty delivery step at 1,869 and 2,015 ms before the change and 1 and 0 ms afterward. These are direct helper timings, not a measured improvement on the deployed site. The remaining opening latency needs further work.

All 485 granular tests, TypeScript and lint passed. Tests retain persistence-failure handling and other-student rejection for actual delivery, and add checks for empty views and paused views carrying material. No graph, bank, evidence requirements or saved session data changed. The optimization is prepared; production remains the revision-six deployment while its full browser journey continues.
