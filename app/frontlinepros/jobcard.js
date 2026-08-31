import { DataPlate } from './plate';

/* The job card as it actually arrives — on the owner's phone. */
export function JobCardPhone() {
  return (
    <div className="device-wrap card-phone">
      <div className="device">
        <div className="device-screen">
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

          <div className="jc-head">
            <b>New job card</b>
            <span>Ace Appliance &middot; today 2:16 PM</span>
          </div>

          <div className="jc-scroll">
            <div className="jc-card">
              <div className="jc-top">
                <span>Job Card</span>
                <span>No. 1042</span>
              </div>
              <div className="jc-body">
                <div className="jc-row">
                  <div className="k">Customer</div>
                  <div className="v">
                    Dana Whitfield
                    <span className="sub">(407) 555-0148</span>
                  </div>
                </div>
                <div className="jc-row">
                  <div className="k">Address</div>
                  <div className="v">218 Palmetto Ln, Winter Park, FL 32789</div>
                </div>
                <div className="jc-row">
                  <div className="k">Equipment</div>
                  <div className="v">
                    Whirlpool WRF535SWHZ04
                    <span className="sub">Serial HRB4102877 &middot; read from photo</span>
                  </div>
                </div>
                <div className="jc-row">
                  <div className="k">Problem</div>
                  <div className="v">
                    &ldquo;Fridge side stopped getting cold since yesterday, freezer still fine,
                    clicking every few minutes.&rdquo;
                  </div>
                </div>
                <div className="jc-row">
                  <div className="k">Screening</div>
                  <div className="v">Door sealing &middot; breaker not tripped</div>
                </div>
              </div>
              <div className="jc-photo">
                <DataPlate />
              </div>
            </div>
          </div>

          <div className="homebar" />
        </div>
      </div>
      <p className="device-cap">The job card, waiting when you finish the job you&rsquo;re on.</p>
    </div>
  );
}
