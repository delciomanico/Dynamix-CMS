const P: Record<string, string> = {
  home: 'M3 11 L12 3 L21 11 M5 9.5 V20 H10 V14 H14 V20 H19 V9.5',
  folder: 'M3 7 H10 L12 9 H21 V19 H3 Z',
  box: 'M12 3 L21 8 V16 L12 21 L3 16 V8 Z M3 8 L12 13 L21 8 M12 13 V21',
  edit: 'M4 20 H8 L19 9 L15 5 L4 16 Z M13 7 L17 11',
  image: 'M4 5 H20 V19 H4 Z M4 16 L9 11 L13 15 L16 12 L20 16 M15 9 H15.01',
  plug: 'M9 3 V8 M15 3 V8 M6 8 H18 V12 A6 6 0 0 1 6 12 Z M12 18 V21',
  gear: 'M12 9 A3 3 0 1 0 12.01 9 M12 2 V5 M12 19 V22 M2 12 H5 M19 12 H22 M5 5 L7 7 M17 17 L19 19 M19 5 L17 7 M7 17 L5 19',
  menu: 'M4 7 H20 M4 12 H20 M4 17 H20',
  close: 'M6 6 L18 18 M18 6 L6 18',
  logout: 'M10 4 H5 V20 H10 M14 8 L19 12 L14 16 M19 12 H9',
  plus: 'M12 5 V19 M5 12 H19',
  arrow: 'M5 12 H19 M13 6 L19 12 L13 18',
  copy: 'M9 9 H20 V20 H9 Z M5 15 V4 H16',
  globe: 'M12 3 A9 9 0 1 0 12.01 3 M3 12 H21 M12 3 C8 8 8 16 12 21 M12 3 C16 8 16 16 12 21',
};

export function Icon({ name, className = 'w-5 h-5' }: { name: keyof typeof P | string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d={P[name]} className="sketch" />
    </svg>
  );
}
