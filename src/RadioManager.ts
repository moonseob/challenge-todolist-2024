/** register callback and emit value changes */
export default class RadioManager<V> {
  private _controls: NodeListOf<HTMLInputElement>;
  private _onChange: ((value: V) => void) | undefined;
  constructor(private _radioName: string) {
    this._controls = document.querySelectorAll(`input[type=radio][name=${this._radioName}]`);
    this._controls.forEach((control) =>
      control.addEventListener('change', this._handleChangeEvent.bind(this)),
    );
  }

  set onChange(cb: NonNullable<typeof this._onChange>) {
    this._onChange = cb;
  }

  get value(): V | null {
    for (const control of this._controls) {
      if (control.checked) {
        return control.value as V;
      }
    }
    return null;
  }

  private _handleChangeEvent(event: Event) {
    const value = (event.currentTarget as HTMLInputElement).value as V;
    this._onChange?.(value);
  }
}
