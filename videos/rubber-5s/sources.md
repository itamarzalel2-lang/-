# Sources: "What if all rubber disappeared for 5 seconds?"

Step 2 of the workflow: every number that appears on screen has a source, checked before the scene was written.

| On screen | Value used | Source | Note |
|---|---|---|---|
| People through Times Square | ~220,000 per day | Times Square Alliance pedestrian counts (2024 average about 220k; June 2024 = 227,920/day; August 2024 = 223,458/day). [market research data](https://www.timessquarenyc.org/business-community/market-research-data) · [2024 annual report](https://www.timessquarenyc.org/sites/default/files/resource-pdfs/TSA_Annual%20Report_2024_COMPRESSED.pdf) | The 2023 average was higher (283,090/day) and peak days reach ~330k, so "~220,000 on an average day" is conservative. |
| How far every car drops | ~13 cm | Calculation from the tire size code: a common 215/60R16 tire has a sidewall that is 60% of 215 mm = 129 mm. When the rubber disappears, the rim (and the car) drops by about the sidewall height. | Low-profile tires drop less, SUV tires more. The card says "~". |
| How much of a tire is rubber | ~41% | Continental Tires, tire-compound breakdown (rubber, natural plus synthetic, 41%; the rest is fillers, steel and fabric reinforcement, plasticizers, etc.). [continental-tires.com](https://www.continental-tires.com/ca/en/b2c/tire-knowledge/tire-mixture.html) | Other breakdowns (e.g. 14% natural + 27% synthetic for a passenger tire) also sum to about 41%. Truck tires differ. |
| Yellow cabs in NYC | 13,587 | NYC Taxi & Limousine Commission: "by law, there are 13,587 yellow taxis in New York City". [nyc.gov/tlc](https://www.nyc.gov/site/tlc/businesses/yellow-cab.page) | Fixed by law. About 10,870 were active in 2024 (TLC OFS report), but every one has tires. |
| Cars in the scene | 352 | The scene itself: `timesSquare({ cars: 352 })`. The counter counts the actual cars rendered. | Not a real-world claim. |

## Physics that is shown but has no number on screen

- **When the rubber comes back, the tires are flat.** The tire disappears, so the compressed air inside it escapes immediately. Five seconds later the rubber returns to the same place, but the air does not. Every tire is at 0 PSI (gauge), and the car sits on a squashed sidewall.
- **Sparks:** steel or alloy rims grinding on asphalt throw sparks. Drivers brake hard, and the cars stop within a few meters (the scene uses a deceleration of about 2.6–3.6 m/s², lower than on rubber).
- **Shoe soles** (rubber) disappear too. People drop 2–3 cm and stop to look at the road. The phone's rubber case disappears as well.
