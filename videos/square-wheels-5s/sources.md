# Sources: "What if every wheel turned square for 5 seconds?"

| On screen | Value | Source / calculation |
|---|---|---|
| The axle rises ~14 cm per quarter turn | 13.7 cm | A square with a 66 cm side (the same footprint as the tire): corner-to-center distance a√2 vs. a: (√2−1)×33 cm ≈ 13.7 cm |
| 7.6 slams per second at 18 km/h | 7.6/s | 5 m/s ÷ 0.66 m per quarter turn (one side's length) |
| A square wheel rolls smoothly on a road of inverted catenaries | n/a | Stan Wagon, Macalester College: a square-wheeled trike on a road of inverted catenaries (built in 1997, rebuilt in 2004). [Macalester](https://macalester.edu/mscs/?p=295) · [Harvey Mudd Math Fun Facts](https://math.hmc.edu/funfacts/?p=172) · [Science News](https://www.sciencenews.org/?p=26095) |

## Implementation
The catenary road in the scene is exact: y = a√2 − a·cosh(u/a) for a bump of length 2a·asinh(1). The square's corners sit in the valleys, and the axle stays at a constant height a√2. That's why the cab body in the demo moves perfectly level.
