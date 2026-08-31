/* A realistic phone showing what the CUSTOMER sees:
   grey bubbles = the shop's automated replies, green = the customer typing back (SMS). */

import { DataPlate } from './plate';

export function PhoneMockup() {
  return (
    <div className="device-wrap">
      <div className="device">
        <div className="device-screen">
          {/* status bar */}
          <div className="status">
            <span className="status-time">2:16</span>
            <span className="island" />
            <span className="status-right">
              <svg width="17" height="11" viewBox="0 0 17 11" aria-hidden="true">
                <rect x="0" y="7.5" width="3" height="3.5" rx="1" fill="currentColor" />
                <rect x="4.5" y="5.5" width="3" height="5.5" rx="1" fill="currentColor" />
                <rect x="9" y="3" width="3" height="8" rx="1" fill="currentColor" />
                <rect x="13.5" y="0" width="3" height="11" rx="1" fill="currentColor" />
              </svg>
              <svg width="16" height="12" viewBox="0 0 16 12" aria-hidden="true">
                <path
                  d="M8 10.5l2.2-2.4a3.2 3.2 0 0 0-4.4 0L8 10.5zM3.6 5.7a6.9 6.9 0 0 1 8.8 0l1.5-1.6a9.1 9.1 0 0 0-11.8 0l1.5 1.6z"
                  fill="currentColor"
                />
              </svg>
              <span className="batt">
                <span className="batt-fill" />
              </span>
            </span>
          </div>

          {/* conversation header */}
          <div className="convo-head">
            <svg className="chev" width="11" height="18" viewBox="0 0 11 18" aria-hidden="true">
              <path
                d="M9.5 1.5L2 9l7.5 7.5"
                stroke="currentColor"
                strokeWidth="2.2"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div className="convo-id">
              <span className="avatar">AA</span>
              <b>Ace Appliance</b>
              <span className="convo-sub">(407) 555-0110</span>
            </div>
          </div>

          {/* thread */}
          <div className="thread">
            <div className="daystamp">
              <b>Today</b> 2:14 PM
            </div>
            <div className="missed">
              <svg width="13" height="13" viewBox="0 0 13 13" aria-hidden="true">
                <path
                  d="M3.2 1.6c.5 1 .8 1.6 1.4 2.2.4.4.4.9.2 1.3-.4.8-.3 1.6.4 2.3l1.4 1.4c.7.7 1.5.8 2.3.4.4-.2.9-.2 1.3.2.6.6 1.2.9 2.2 1.4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  fill="none"
                  strokeLinecap="round"
                />
              </svg>
              Missed call
            </div>

            <div className="bub them">
              Hi, this is Ace Appliance — sorry we couldn&rsquo;t pick up, we&rsquo;re on a job.
              What&rsquo;s wrong?
            </div>
            <div className="bub me">Fridge stopped cooling. Freezer&rsquo;s still fine though</div>
            <div className="bub them">
              Got it. Can you send a photo of the sticker with the model number?
            </div>
            <div className="bub me imgmsg">
              <DataPlate small />
              <span className="shotname">
                <svg width="11" height="11" viewBox="0 0 14 14" aria-hidden="true">
                  <path
                    d="M12 4.2h-2L9.2 3H4.8L4 4.2H2a1 1 0 0 0-1 1v5.6a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V5.2a1 1 0 0 0-1-1z"
                    stroke="currentColor" strokeWidth="1.1" fill="none" />
                  <circle cx="7" cy="8" r="2.1" stroke="currentColor" strokeWidth="1.1" fill="none" />
                </svg>
                data-plate.jpg
              </span>
            </div>
            <div className="bub them phone-trim">
              Perfect — Whirlpool WRF535SWHZ04. Door sealing shut? Breaker on?
            </div>
            <div className="bub me phone-trim">Both fine</div>
            <div className="bub them">
              Thanks. Tom will call you back within the hour.
            </div>
            <div className="delivered">Delivered</div>
          </div>

          {/* input bar */}
          <div className="inputbar">
            <span className="plus">+</span>
            <span className="field">Text Message</span>
            <span className="mic">
              <svg width="15" height="15" viewBox="0 0 16 16" aria-hidden="true">
                <rect x="5.6" y="1.6" width="4.8" height="8" rx="2.4" fill="currentColor" />
                <path
                  d="M3.4 7.6a4.6 4.6 0 0 0 9.2 0M8 12.2v2.2"
                  stroke="currentColor"
                  strokeWidth="1.3"
                  fill="none"
                  strokeLinecap="round"
                />
              </svg>
            </span>
          </div>

          <div className="homebar" />
        </div>
      </div>
      <p className="device-cap">What your customer sees, from a number that names your shop.</p>
    </div>
  );
}
