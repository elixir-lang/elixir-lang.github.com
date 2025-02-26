---
layout: post
title: "Announcing Elixir OpenChain Certification"
authors:
  - Jonatan Männchen
  - José Valim
category: Announcements
excerpt: "The Elixir project now meets OpenChain (ISO/IEC 5230). Each release ships with Source SBoMs in CycloneDX 1.6 and SPDX 2.3, plus attestation."
tags: openchain compliance
---

We are pleased to share that the Elixir project now complies with
[OpenChain][openchain] ([ISO/IEC 5230][iso_5230]), an international
standard for open source license compliance. This step aligns with broader
efforts to meet industry standards for supply chain and cybersecurity best
practices.

“Today’s announcement around Elixir’s conformance represents another significant
example of community maturity,” says Shane Coughlan, OpenChain General Manager.
“With projects - the final upstream - using ISO standards for compliance and
security with increasing frequency, we are seeing a shift to longer-term
improvements to trust in the supply chain.”

## Why OpenChain Compliance Helps

By following OpenChain (ISO/IEC 5230), we demonstrate clear processes around
license compliance. This benefits commercial and community users alike, making
Elixir easier to adopt and integrate with confidence.

## Changes for Elixir Users

Elixir has an automated release process where its artifacts are signed. This
change strengthens this process by:

- All future Elixir releases will include a Source SBoM in
  [CycloneDX 1.6 or later][cyclonedx] and [SPDX 2.3 or later][spdx] formats.
- Each release will be attested along with the Source SBoM.

These additions offer greater transparency into the components and licenses of
each release, supporting more rigorous supply chain requirements.

## Changes for Contributors

Contributing to Elixir remains largely the same, we have added more clarity and
guidelines around it:

- Contributions remain under the Apache-2.0 License. Other licenses cannot be
  accepted.
- The project now enforces the [Developer Certificate of Origin (DCO)][dco],
  ensuring clarity around contribution ownership.

Contributors will notice minimal procedural changes, as standard practices
around licensing remain in place.

For more details, see the [CONTRIBUTING guidelines][contributing].

## Commitment

These updates were made in collaboration with the
[Erlang Ecosystem Foundation][erlef], reflecting a shared
commitment to robust compliance and secure development practices. Thank you to
everyone who supported this milestone. We appreciate the community’s ongoing
contributions and look forward to continuing the growth of Elixir under these
established guidelines.

[openchain]: https://openchainproject.org/
[erlef]: https://erlef.org/
[spdx]: https://spdx.org/rdf/terms/
[cyclonedx]: https://cyclonedx.org/specification/overview/
[iso_5230]: https://www.iso.org/standard/81039.html
[dco]: https://developercertificate.org/
[contributing]: https://github.com/elixir-lang/elixir/blob/main/CONTRIBUTING.md
