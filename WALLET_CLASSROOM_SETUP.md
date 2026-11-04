# Live Classroom setup

The classroom uses LiveKit for real-time media. Supabase remains the source of
truth for user identity, course enrollment, session lifecycle, and attendance.

## Configure

1. Provision a LiveKit Cloud project (or a compatible managed/self-hosted
   LiveKit server).
2. Set `LIVEKIT_URL`, `LIVEKIT_API_KEY`, and `LIVEKIT_API_SECRET` in the
   deployment environment. Use the same values locally in `.env.local`; never
   expose the API secret as a `NEXT_PUBLIC_` variable.
3. Configure the LiveKit webhook URL as
   `https://<your-app-host>/api/live-sessions/webhook` and subscribe to
   `participant_joined`, `participant_left`, and `room_finished`.
4. Apply `database_migrations/008_wallet_livekit.sql` in the Supabase SQL
   Editor after the earlier database migrations.
5. Install dependencies and run the app with `npm install` and `npm run dev`.

## Workflow and data

- Tutors with host access schedule a course session and optionally select a
  lesson. Students need an active or completed course enrollment and a plan
  that permits Live Classroom access.
- Scheduled sessions appear on the enrolled students' dashboard. In-app
  schedule alerts are created for users whose `liveClassNotifications`
  preference is enabled (default: enabled).
- A room is created when the tutor starts class. The optional waiting room
  reserves places only after admission; capacity is checked transactionally.
- API-issued LiveKit tokens expire after two minutes. Tutor tokens permit
  camera, microphone, and screen sharing; student tokens permit camera and
  microphone.
- The LiveKit conference UI provides participant media controls, chat, hand
  raising, screen sharing for tutors, network feedback, and reconnection UI.
- Webhook events are deduplicated and are authoritative for join/leave times
  and accumulated connected seconds. An unexpected room-finished event marks
  a live session `failed`. Opening the room does not advance course progress.
- Chat is provided by LiveKit during the room and is not retained in the
  application database. Email/push delivery and recording are not configured.