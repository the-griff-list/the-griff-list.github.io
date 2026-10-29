
/* LiveKit viewer for The Grifflist. */
(() => {
  const client = window.supabaseClient;
  const video = document.querySelector("#live-video");
  const placeholder = document.querySelector("#live-placeholder");
  const heading = document.querySelector("#live-venue-heading");
  const desc = document.querySelector("#live-description");
  const status = document.querySelector("#live-player-status");
  const badge = document.querySelector("#live-badge");
  const health = document.querySelector("#viewer-health");
  const lowDataControl = document.querySelector("#low-data-mode");

  const TOKEN_URL =
    "https://odd-unit-91b9.grar0842.workers.dev/token";

  let room = null;
  let lowData = false;
  let connecting = false;
  let liveEnabled = false;
  let LiveKit = null;

  function setOffline(message) {
    if (health) health.textContent = message || "Stream offline";
    if (placeholder) placeholder.hidden = false;
    if (status) {
      status.textContent = message || "The show isn't live right now.";
    }
    if (badge) badge.hidden = true;
    if (video) video.style.display = "";
  }

  async function stopViewer() {
    if (room) {
      room.disconnect();
      room = null;
    }
    if (video) {
      video.srcObject = null;
      video.pause();
    }
    document.querySelectorAll("[data-livekit-audio]").forEach(el => el.remove());
    connecting = false;
  }

  async function startViewer() {
    if (!liveEnabled || connecting || room) return;
    connecting = true;
    setOffline("Connecting to the live show…");

    try {
      if (!LiveKit) {
        LiveKit = await import(
          "https://cdn.jsdelivr.net/npm/livekit-client/+esm"
        );
      }

      const response = await fetch(TOKEN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "viewer" })
      });

      if (!response.ok) {
        throw new Error("Viewer token request failed: " + response.status);
      }

      const data = await response.json();
      const newRoom = new LiveKit.Room();
      room = newRoom;

      newRoom.on(LiveKit.RoomEvent.TrackSubscribed, (track) => {
        if (track.kind === LiveKit.Track.Kind.Video) {
          if (lowData) {
            track.detach();
            return;
          }
          track.attach(video);
          video.style.display = "";
          if (placeholder) placeholder.hidden = true;
          if (badge) badge.hidden = false;
          if (health) health.textContent = "Connected · live video and audio";
          video.play().catch(() => {});
        } else if (track.kind === LiveKit.Track.Kind.Audio) {
          const audio = track.attach();
          audio.dataset.livekitAudio = "true";
          document.body.appendChild(audio);
          if (placeholder) placeholder.hidden = true;
          if (badge) badge.hidden = false;
          if (health) {
            health.textContent = lowData
              ? "Connected · audio-only mode"
              : "Connected · live audio";
          }
        }
      });

      newRoom.on(LiveKit.RoomEvent.TrackUnsubscribed, (track) => {
        track.detach().forEach(el => {
          if (el.dataset.livekitAudio) el.remove();
        });
      });

      newRoom.on(LiveKit.RoomEvent.Disconnected, () => {
        if (room === newRoom) {
          room = null;
          setOffline("Disconnected. Tap Reconnect or refresh the page.");
        }
      });

      await newRoom.connect(data.serverUrl, data.token);

      if (room !== newRoom) return;

      for (const participant of newRoom.remoteParticipants.values()) {
        for (const publication of participant.trackPublications.values()) {
          if (
            lowData &&
            publication.kind === LiveKit.Track.Kind.Video
          ) {
            publication.setSubscribed(false);
          } else {
            publication.setSubscribed(true);
          }
        }
      }

      if (newRoom.remoteParticipants.size === 0) {
        setOffline("Connected. Waiting for a live performance…");
      } else {
        if (health) health.textContent = "Connected. Waiting for media…";
      }
    } catch (error) {
      console.error("Live playback failed:", error);
      if (room) {
        room.disconnect();
        room = null;
      }
      setOffline("Could not connect. The stream may be offline. Please retry.");
    } finally {
      connecting = false;
    }
  }

  async function refreshSettings() {
    if (!client) {
      setOffline("The live page needs the Supabase configuration.");
      return;
    }

    try {
      const { data, error } = await client
        .from("live_show_settings")
        .select("venue_name,show_enabled,is_live")
        .eq("id", 1)
        .maybeSingle();

      if (error) throw error;

      const venue = data?.venue_name?.trim() || "Live";
      if (heading) heading.textContent = venue;
      if (desc) {
        desc.textContent = data?.is_live
          ? `You're watching live from ${venue}. Request a song or support the show below.`
          : `Watch the show from ${venue}, request a song, and support the music.`;
      }

      liveEnabled = !!(data && data.show_enabled && data.is_live);

      if (!liveEnabled) {
        await stopViewer();
        setOffline(
          data?.show_enabled
            ? "The show is not marked live right now."
            : "The next live show will appear here."
        );
        return;
      }

      if (!room && !connecting) await startViewer();
    } catch (error) {
      console.error("Live settings failed:", error);
      await stopViewer();
      setOffline("Watch Live settings could not be loaded.");
    }
  }

  const bars = document.querySelector("#live-rockometer-bars");
  if (bars) {
    bars.replaceChildren();
    for (let i = 0; i < 10; i++) {
      bars.appendChild(document.createElement("span"));
    }
  }

  async function refreshMeter() {
    if (!client || !bars) return;

    try {
      const { data, error } = await client
        .from("rock_meter_settings")
        .select("goal_amount,raised_amount")
        .eq("id", 1)
        .maybeSingle();

      if (error || !data) return;

      const goal = Math.max(1, Number(data.goal_amount) || 200);
      const raised = Math.max(0, Number(data.raised_amount) || 0);
      const pct = Math.min(100, Math.round(raised / goal * 100));

      document.querySelector("#live-rockometer").hidden = false;
      document.querySelector("#live-rockometer-percent").textContent = pct + "%";
      document.querySelector("#live-rockometer-raised").textContent =
        `$${raised.toFixed(0)} / $${goal.toFixed(0)}`;

      [...bars.children].forEach((bar, i) => {
        bar.classList.toggle("on", i < Math.round(pct / 10));
      });
    } catch (error) {
      console.error("Rockometer refresh failed:", error);
    }
  }

  lowDataControl?.addEventListener("change", async event => {
    lowData = event.target.checked;
    await stopViewer();
    if (liveEnabled) await startViewer();
  });

  const retryButton = document.createElement("button");
  retryButton.type = "button";
  retryButton.textContent = "Reconnect";
  retryButton.className = "button button-quiet";
  retryButton.style.marginTop = "12px";
  retryButton.addEventListener("click", async () => {
    await stopViewer();
    await refreshSettings();
  });

  const shell = document.querySelector(".live-player-shell");
  if (shell) shell.appendChild(retryButton);

  refreshSettings();
  refreshMeter();
  window.setInterval(refreshSettings, 15000);
  window.setInterval(refreshMeter, 20000);
  window.addEventListener("pagehide", stopViewer);
})();
