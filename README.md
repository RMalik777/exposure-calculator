# Exposure Stop Calculator

Exposure Stop Calculator compares two sets of camera settings. It shows the difference between the two sets in stops. It also tells you how to change one set so that its exposure is the same as the other set.

- [For users](#for-users)
- [For developers](#for-developers)

## For users

### What the calculator does

The calculator has two columns, `A` and `B`. Each column has three settings: ISO, shutter speed, and aperture. One column is the reference. The other column is the target.

The calculator shows:

- The difference in stops for each setting
- The total difference between the target and the reference, in stops and in EV
- One in-camera change for each setting that gives the target the same exposure as the reference
- The Exposure slider value that gives the target the same exposure as the reference in post-processing.

### Compare two sets of settings

1. Enter the ISO, shutter speed, and aperture for column `A`.
2. Enter the ISO, shutter speed, and aperture for column `B`.
3. In `Reference`, select `A` or `B`.
4. Read the total difference at the bottom of the `Compare settings` card.
5. Read the `Match` section to find how to change the target.

To interchange the values of column `A` and column `B`, click `Swap`.

### Input formats

You can select a value from the list, or you can type a value. The calculator accepts these formats:

| Setting       | Format                                                    | Examples                   |
| ------------- | --------------------------------------------------------- | -------------------------- |
| ISO           | A number, with or without `ISO` before it                 | `640`, `ISO 100`           |
| Shutter speed | A fraction, or seconds with or without `s`, `sec`, or `"` | `1/250`, `0.5`, `2s`, `2"` |
| Aperture      | An f-number, with or without `f/` or `f` before it        | `f/5.6`, `f2.8`, `2.8`     |

If the calculator cannot read a value, it shows a hint below the field. The calculator shows the results only when all six settings are correct.

### How to read the results

The calculator shows stops in 1/3-stop steps. For example, `+1⅓` is one and one-third stops more bright. `−⅔` is two-thirds of a stop less bright.

#### In camera

Each row of the `In camera` table gives one alternative. Change only the setting in that row on the target. The table has these columns:

- `Now`: the value that the target has at this time
- `Set to`: the nearest standard value
- `Exact`: the calculated value before the calculator changes it to a standard value
- `Off by`: the difference that stays after you use the `Set to` value. A positive value shows that the target is more bright than the reference.

If the necessary value is not in the standard range, the table shows `Out of range`. The standard ranges are:

- ISO: 50 to 102400
- Shutter speed: 1/8000 to 30s
- Aperture: f/1 to f/32.

#### In post

The `In post` card gives the value for the Exposure slider in Lightroom, Camera Raw, or Capture One. Set this value on the target image. The card also gives a value for the reference image. Use this value to change the reference image.

The Exposure slider in Lightroom has a range of −5 to +5 stops. If the necessary change is more than this range, the card shows `Beyond Lightroom's ±5 range`.

> [!NOTE]
> Changes in post-processing give the best results on raw files. If you decrease the exposure, areas that are fully white stay white. If you increase the exposure, the image gets more noise.

## For developers

### Technology

- [TanStack Start](https://tanstack.com/start) with React 19 and file-based routing from TanStack Router
- [Vite](https://vite.dev/) 8 with the React Compiler
- [Tailwind CSS](https://tailwindcss.com/) 4 and [shadcn/ui](https://ui.shadcn.com/) components on [Base UI](https://base-ui.com/)
- [Vitest](https://vitest.dev/) for unit tests
- [Cloudflare Workers](https://developers.cloudflare.com/workers/) for hosting, with Wrangler.

### Prerequisites

- Node.js version 22 or higher
- pnpm 12. The `packageManager` field in `package.json` sets the pnpm version. To use this version, run `corepack enable`.

### Install and start the app

1. Clone the repository.
2. Install the dependencies:

   ```bash
   pnpm install
   ```

3. Start the development server:

   ```bash
   pnpm dev
   ```

4. Open `http://localhost:3000` in your browser.

### Scripts

| Command           | Result                                                     |
| ----------------- | ---------------------------------------------------------- |
| `pnpm dev`        | Starts the development server on port 3000.                |
| `pnpm build`      | Builds the app for production.                             |
| `pnpm preview`    | Starts a local server for the production build.            |
| `pnpm test`       | Runs the unit tests one time.                              |
| `pnpm lint`       | Runs ESLint.                                               |
| `pnpm check`      | Makes sure that the files obey the Prettier format.        |
| `pnpm format`     | Formats all files with Prettier and fixes ESLint problems. |
| `pnpm run deploy` | Builds the app and deploys it to Cloudflare Workers.       |

To deploy, use `pnpm run deploy`, not `pnpm deploy`. pnpm has a built-in `deploy` command. Thus, `pnpm deploy` does not run the `deploy` script.

### Project structure

| Path                                     | Contents                                                                                                   |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `src/lib/exposure.ts`                    | All exposure calculations, parsers, formatters, and lists of standard values. This file has no React code. |
| `src/lib/exposure.test.ts`               | Unit tests for `exposure.ts`.                                                                              |
| `src/routes/index.tsx`                   | The calculator page. It keeps the state for the two columns.                                               |
| `src/routes/__root.tsx`                  | The HTML shell for all pages.                                                                              |
| `src/components/settings-comparison.tsx` | The `Compare settings` card.                                                                               |
| `src/components/compensation-table.tsx`  | The `In camera` table.                                                                                     |
| `src/components/post-adjustment.tsx`     | The `In post` card.                                                                                        |
| `src/components/stop-value-combobox.tsx` | The input field. It lets the user select a standard value or type a value.                                 |
| `src/components/ui/`                     | Components from the shadcn CLI.                                                                            |
| `src/routeTree.gen.ts`                   | The route tree. TanStack Router generates this file. Do not edit it.                                       |

The `#/` import alias points to `src/`. For example, `#/lib/exposure` is `src/lib/exposure.ts`.

To add a shadcn component, run this command:

```bash
pnpm dlx shadcn@latest add <component>
```

### How the calculation works

The calculator calculates a stop position for each setting. The stop position of ISO 100, 1 second, and f/1 is 0. A higher position gives a more bright image.

| Setting       | Stop position         |
| ------------- | --------------------- |
| ISO           | `log2(iso / 100)`     |
| Shutter speed | `log2(seconds)`       |
| Aperture      | `-2 * log2(f-number)` |

Cameras show approximate numbers for standard values. For example, a camera shows `1/125`, but the accurate value is `1/128`. Thus, the calculator puts each standard value accurately on a 1/3-stop position. A value that is not standard, for example `1/37`, uses the formula without a change.

The total difference is the sum of the differences for ISO, shutter speed, and aperture. To align the target with the reference, the target must move by the total difference in the opposite direction. For each setting, the calculator adds this change to the current position. Then it finds the nearest standard value. The remaining difference is the `Off by` value.

### Tests

The unit tests are in `src/lib/exposure.test.ts`. Add new tests in files that have the name `*.test.ts` in `src/`.

To run the tests, run this command:

```bash
pnpm test
```

Vitest uses `vitest.config.ts`, not `vite.config.ts`. As a result, the tests do not load the TanStack Start and Cloudflare plugins.

### Code style

Before you commit, run this command:

```bash
pnpm format
```

To find problems without changes to the files, run `pnpm check` and `pnpm lint`.

### Deploy to Cloudflare Workers

1. Log in to Cloudflare:

   ```bash
   pnpm exec wrangler login
   ```

2. Build and deploy the app:

   ```bash
   pnpm run deploy
   ```

The `name` field in `wrangler.jsonc` sets the name of the Worker. To deploy with a different name, change this field.

## License

This project uses the MIT License. Refer to [LICENSE](LICENSE).
