# Vendored: tibetan-ewts-converter 2.0.0 (EwtsConverter.mjs)

- Package: `tibetan-ewts-converter` 2.0.0 on npm (https://github.com/rogerespel/ewts-js)
- Author: Roger Espel Llima, Copyright (C) 2010-2025
- License: Apache License 2.0 (see `LICENSE-Apache-2.0.txt` in this folder)
- Lineage: the JavaScript port of `Lingua::BO::Wylie` (Perl, 2008) by its original author,
  incorporating improvements from the Java `ewts-converter` used by BDRC.

Only `src/EwtsConverter.mjs` is vendored (unmodified). The phonetics modules and word lists
from the package are not used. Access it through `../ewts.js`, never directly.

Evaluated and not chosen: `jsewts` 1.0.4 (BDRC's JavaScript port, Apache-2.0). It produces the
same Tibetan for every case tested, but on Unicode → Wylie it drops the space that follows a
shad, so a Unicode passage does not round-trip byte for byte; its module wrapper also touches
`window` at load time and is not a clean ES module.
