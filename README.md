<img src="assets/icon.svg" width="64" height="64" alt="">

# Who Dat Imposter?

A pass-and-play party word game for 3–15 people, built with React Native (Expo SDK 58).
Everyone gets the same secret word except the imposter, who has to bluff their way through
the clues without knowing it. Every category, mode and feature is free: no subscriptions,
no paywalls, no ads.

**[Download the Android APK](https://github.com/natyavidhan/who-dat-imposter/releases/latest)** from the
latest release, open it on your phone and allow the install.

## How a round works

1. **Set up** in the lobby: players, categories, number of imposters and house rules.
2. **Pass the phone.** Each player taps a card in secret to see the word, or learns they are
   the imposter (optionally with a hint).
3. **Give clues.** A random player starts, then everyone around the circle says one word
   linked to the secret word. An optional timer counts down the discussion.
4. **Vote.** The group picks its suspect(s) on the phone and gets a dramatic verdict.
5. **Last chance.** A caught imposter can still steal the win by guessing the word.
6. **Scores** carry across rounds: crew +1 each for catching every imposter, imposters +2
   each for escaping or stealing the win.

## Features

- 16 built-in categories with 684 words, each with a vague clue word for the imposter
- Custom categories with your own words (paste a comma-separated list to add many at once)
- 1 or more imposters (always fewer than the crew)
- Imposter hint: none, the category, or a clue word
- Discussion timer (1–5 min) with pause and +30s
- Chaos rounds: now and then everyone is secretly the imposter
- "Forgot your word?" re-peek for a single player
- Scoreboard, haptics, keep-awake during rounds, and everything saved on the device

## Run it

```bash
npm install
npx expo start
```

- **Android:** install Expo Go for SDK 58 (see [expo.dev/go](https://expo.dev/go)) and scan
  the QR code, or press `a` with an emulator running.
- **Web:** press `w`.
- **iPhone:** the App Store version of Expo Go stops at SDK 54, so use a development build
  (`npx expo run:ios` on a Mac) or an EAS build.

### Release a new APK

GitHub Actions builds the APK (`.github/workflows/android-apk.yml`). Bump `version` and
`android.versionCode` in `app.json`, commit, then push a tag:

```bash
git tag v1.0.1 && git push origin v1.0.1
```

The workflow tests the code, builds a release APK for real phones (arm64 and armv7) and
attaches it to a GitHub release for that tag. It is signed with a development key, which is
fine for sideloading but not for the Play Store.

For a Play Store build, use EAS (`npx eas-cli@latest build --platform android --profile
production`, needs a free Expo account) and change `android.package` /
`ios.bundleIdentifier` in `app.json` to your own first. The `preview` EAS profile also
produces a sideloadable `.apk`.

## Development

```bash
npm test           # game rules + word-pack integrity tests
npm run lint
npm run typecheck
```

| Path | What lives there |
| --- | --- |
| `src/app/` | Screens (Expo Router): lobby, players, categories, editor, game, scores, rules |
| `src/features/game/` | The four round phases: reveal, discuss, vote, result |
| `src/game/engine.ts` | Pure game rules (word picking, roles, voting, scoring), unit tested |
| `src/data/categories.ts` | Built-in word packs as `[word, imposter clue]` pairs |
| `src/store/` | Zustand store persisted with AsyncStorage |
| `src/components/` | UI kit: `Pop` (outlined card with hard shadow), `Button`, `Txt`, controls |
| `assets/brand/icon.svg` | Source artwork for the app icon and splash screen |
