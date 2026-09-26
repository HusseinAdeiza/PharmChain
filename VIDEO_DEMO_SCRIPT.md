# PharmChain 90-second video demo script

**Format:** 1080p screen recording, 16:9, browser zoom 100%, no personal addresses visible longer than necessary.

## Pre-record

- Open `https://pharmchain.vercel.app/` in a clean browser window.
- Have a browser wallet installed and unlocked on Monad Mainnet.
- Keep the official NAFDAC alert page available in a second tab.
- Do not narrate the demo records as regulator-certified products.

## Recording

| Time | Screen action | Narration |
|---|---|---|
| 0:00–0:08 | Show a medicine packet or printed demo pack, then the PharmChain landing page. | “A number printed on a medicine pack is not enough. The same number can be copied, attached to the wrong formulation, or recalled after it reaches the shelf.” |
| 0:08–0:15 | Click **Choose wallet**. Show the wallet logos, select an installed wallet, and show the connected address. | “PharmChain makes the wallet choice explicit. I connect the wallet I want to use; PharmChain never stores its keys.” |
| 0:15–0:25 | Open `https://pharmchain.vercel.app/verify/A4-0425`. Show the VERIFIED stamp, paracetamol batch, manufacturer label, credential, and IPFS evidence link. | “This is a seeded demonstration passport: paracetamol, Emzor Nigeria Ltd, with a real contract-backed batch record and pinned evidence. The demo label is intentional.” |
| 0:25–0:35 | Open `https://pharmchain.vercel.app/verify/A4-0426`. Point at the RECALLED stamp and batch `DEMO-FIDSON-0426`. Open its MonadScan link. | “Now the same scan catches a specific recalled amoxicillin batch. The record names the batch, the reason, the wallet, and the transaction on Monad Mainnet.” |
| 0:35–0:45 | Open `https://pharmchain.vercel.app/verify/A4-0427`. Show the counterfeit report and the Unverified Labs claim. | “A third passport shows the counterfeit layer: one party claims a product key that another manufacturer already attested. The report is visible, validated, and separate from the batch record.” |
| 0:45–0:56 | Open `https://pharmchain.vercel.app/verify/04-2531`. Show “Product found · not yet on-chain” and the Dizpharm Paracetamol Green Book record. | “For a real number that is not on PharmChain yet, the system checks the official Nigerian product record. It shows the product honestly and does not pretend the batch is verified.” |
| 0:56–1:06 | Use the registry selector and open `https://pharmchain.vercel.app/verify/fda-ndc%3AUS%3A50580-590`. Show the US FDA NDC result. | “The same interface is jurisdiction-aware. A US NDC resolves through a second official adapter, with the source and the same non-verification boundary.” |
| 1:06–1:15 | Open the language selector, switch to French, then back to English. Show the header navigation and status copy. | “The core verification experience is localized, while identifiers and evidence provenance remain explicit.” |
| 1:15–1:23 | Show the live proof strip: 6 credentials, 18 batches, 2 reports, 4 pinned PDFs. Show the contract address link. | “The proof is inspectable: six credentials, eighteen batches, two reports, four pinned evidence PDFs, all anchored to Monad Mainnet.” |
| 1:23–1:30 | End on the passport and GitHub repository link. | “PharmChain: one scan, one transparent record, and a safer decision before a medicine reaches a patient. Source and deployment are public.” |

## Exact links to keep open

- App: `https://pharmchain.vercel.app/`
- Verified demo: `https://pharmchain.vercel.app/verify/A4-0425`
- Recalled demo: `https://pharmchain.vercel.app/verify/A4-0426`
- Counterfeit demo: `https://pharmchain.vercel.app/verify/A4-0427`
- Official product fallback: `https://pharmchain.vercel.app/verify/04-2531`
- US FDA adapter: `https://pharmchain.vercel.app/verify/fda-ndc%3AUS%3A50580-590`
- Source: `https://github.com/HusseinAdeiza/PharmChain`
