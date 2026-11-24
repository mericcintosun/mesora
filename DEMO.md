# DEMO: the 90 second path

**Demo start route:** `/`

**Problem.** A group of four friends in Istanbul needs one venue for Friday supper. In WhatsApp that takes about 40 messages, and the "meet in the middle" tools that exist pick the map midpoint, which sends one friend on a 74 minute trip.

**Trigger.** A friend opens the shared Mesora link.

**Wow moment.** The midpoint venue sends one friend 74 minutes. Mesora's pick keeps everyone at 38 minutes or less, and no server saw anyone's location.

## Steps

1. Open the start route `/` (`app/page.tsx`). The pinned scene shows the before and after: every friend's trip bar moves from the midpoint venue (longest 74 min) to Mesora's pick (longest 38 min) as you scroll.
2. Go to `/join/area` (`app/join/[step]/page.tsx`). Type the sample sentence ("I'm in Kadıköy, vegetarian, can't leave before 19:00, 400 lira a head max") into the agent box, and the card is added to the live preview.
3. Step through `/join/diet`, `/join/budget` and `/join/time` (same file, `app/join/[step]/page.tsx`), which add the other constraints. The preview updates at each step.
4. Open `/result/friday-supper` (`app/result/[id]/page.tsx`). The solve runs, filtered venues are greyed out with their reason, and the midpoint's 74 min sits next to Mesora's 38 min.
5. Open `/result/live` (same file, `app/result/[id]/page.tsx`) in a second window with the shared link. The browser decodes the link's fragment and shows district-only cards.
6. Open `/about` from the header nav ("Method", `app/about/page.tsx`). It shows the method and the three spec site actions.
7. Scroll to `/about#peer` (`components/peer-call.tsx`, rendered by `app/about/page.tsx`). Press "Ask Mesora for the group plan" in the Friday Night Events panel, then "Allow once" on the consent card. The event site's agent calls Mesora's `website_solve_plan` with the Friday supper link and shows the same plan: Yenikapı Avlu Mutfak, longest trip 38 min for Mesora's pick against 74 min at the map midpoint, with a link "Open the plan" to `/result/friday-supper`. The panel is labelled Simulated: the call runs in this page through `siteActions`, because the cross-site spec runtime is not vendored yet. "Cancel" calls nothing.

## Closing line

Nobody gave anyone their address. The decision lives in the link.
