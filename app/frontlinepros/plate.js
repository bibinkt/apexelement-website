/* A rendered appliance data plate — the sticker the customer photographs.
   Rendered rather than stock-photographed so it carries the exact model and
   serial that appear on the job card. */

export function DataPlate({ small = false }) {
  return (
    <div className={small ? 'plate-shot plate-sm' : 'plate-shot'}>
      <div className="plate-metal">
        <div className="plate-brand">
          <b>Whirlpool</b>
          <span>REFRIGERATOR</span>
        </div>
        <div className="plate-rows">
          <div>
            <em>MODEL NO.</em>
            <b>WRF535SWHZ04</b>
          </div>
          <div>
            <em>SERIAL NO.</em>
            <b>HRB4102877</b>
          </div>
          <div>
            <em>VOLTS / HZ</em>
            <b>115V 60Hz</b>
          </div>
          <div>
            <em>REFRIGERANT</em>
            <b>R-600a 55g</b>
          </div>
        </div>
        <div className="plate-code">
          <span className="barcode" aria-hidden="true" />
          <em>MADE IN U.S.A.</em>
        </div>
      </div>
    </div>
  );
}
