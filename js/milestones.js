/*
  EDIT ME — add more stops here later. Stops with type "telephone" get the
  special icon marker (see maze.js); everything else is a normal card.
  The unicorn puzzle isn't a stop any more: it lives at the maze's finish
  line in maze mode, and as a floating bubble outside it (js/puzzle-bubble.js).
*/

const MILESTONES = [
  {
    type: "telephone",
    title: "telephone directory",
    tagline: "a real rotary phone wired into claude",
    status: "building",
    tabs: [
      {
        label: "the vibe",
        html: `
          <ol class="phone-steps">
            <li class="phone-step">
              <div class="phone-step-icons">
                <span class="step-icon">${telephoneSVG()}</span>
                <span class="step-arrow">→</span>
                <span class="step-icon printer-stack">
                  <span class="step-icon-sticker">${stickerSVG()}</span>
                  <span class="step-icon-printer">${printerSVG()}</span>
                </span>
              </div>
              <p>dial 126 and tell it what sticker you want. claude decides
                whether that's a poem or a picture, and it prints right
                there.</p>
            </li>
            <li class="phone-step">
              <div class="phone-step-icons">
                <span class="step-icon">${telephoneSVG()}</span>
                <span class="step-arrow">→</span>
                <span class="step-icon">${speakerSVG()}</span>
                <span class="eq-bars"><span></span><span></span><span></span></span>
              </div>
              <p>dial 121 and ask for a song or a playlist. my speaker
                builds a spotify playlist for it and starts playing.</p>
            </li>
          </ol>
        `
      },
      {
        label: "the tech",
        html: `
          <p class="card-desc">built from a real rotary telephone → a
            grandstream ATA (turns the phone line into audio in and out) →
            a raspberry pi running the switchboard → a brother QL label
            printer for stickers.</p>
          <ul class="card-tech-list">
            <li><code>switchboard.py</code> records ~6s of audio off the
              line once you dial, then hands it to <code>whisper.cpp</code>
              (the ggml-base.en model) for fully local speech-to-text — no
              cloud round-trip just to hear what you said.</li>
            <li>the transcript gets routed by service code. <code>126</code>
              → <code>print.py</code>: claude reads the request, decides
              text or image, generates it, and the brother QL prints it as
              a sticker on the spot.</li>
            <li><code>121</code> → <code>vibe.py</code>: claude turns the
              request into a spotify search/playlist and playback starts on
              my speaker.</li>
            <li>next up: wiring the actual rotary dial in as the service
              selector — right now the service number still gets typed in
              by hand.</li>
          </ul>
          <div class="card-tags">
            ${["raspberry pi", "grandstream ata", "whisper.cpp", "claude", "spotify", "label printer"]
              .map((t) => `<span class="tag">${t}</span>`)
              .join("")}
          </div>
        `
      }
    ],
    images: []
  }
];
