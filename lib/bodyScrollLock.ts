// Event details and the interest form can be open together. Restore scrolling
// only after the last owner releases its lock, regardless of cleanup order.
let owners = 0;
let previousOverflow = '';

export function lockBodyScroll(): () => void {
  if (owners === 0) {
    previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }
  owners += 1;

  let released = false;
  return () => {
    if (released) return;
    released = true;
    owners -= 1;
    if (owners === 0) document.body.style.overflow = previousOverflow;
  };
}
