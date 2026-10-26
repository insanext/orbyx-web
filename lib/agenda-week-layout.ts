// Distribución de citas en la grilla semanal de la Agenda.
// - Posición vertical por hora real, en "filas" de 30 min (una de 45 min = 1,5 filas).
// - Las citas que se cruzan en horario van en carriles lado a lado.
// - Con más carriles que maxLanes, las que no caben quedan como "desborde"
//   (la vista dibuja un "+N" con ellas).
// Puro (sin React) para poder probarlo por separado.

export const AGENDA_SLOT_MS = 30 * 60000;

export type WeekLayoutInput = { start: number; end: number };

export type WeekLayoutItem<T extends WeekLayoutInput> = {
  item: T;
  /** Fila de inicio y fin (fraccionarias), relativas a la primera fila de la grilla. */
  top: number;
  bottom: number;
  lane: number;
  /** Carriles que se dibujan en su grupo (máx. maxLanes). */
  shownLanes: number;
  /** true: no cabe; va dentro de un "+N". */
  overflow: boolean;
  /** Solo en el primer desbordado de cada tramo: todas las citas de ese "+N". */
  overflowGroup: T[] | null;
};

export function layoutWeekAppointments<T extends WeekLayoutInput>(
  inputs: T[],
  slotTimes: number[],
  maxLanes: number
): WeekLayoutItem<T>[] {
  if (slotTimes.length === 0 || inputs.length === 0) return [];

  const rowPos = (time: number) => {
    if (time <= slotTimes[0]) return 0;
    let index = 0;
    for (let k = 0; k < slotTimes.length; k += 1) {
      if (slotTimes[k] <= time) index = k;
      else break;
    }
    return index + Math.min((time - slotTimes[index]) / AGENDA_SLOT_MS, 1);
  };

  const sorted = [...inputs]
    .map((item) => ({ item, start: item.start, end: Math.max(item.end, item.start + 15 * 60000) }))
    .sort((a, b) => a.start - b.start || b.end - b.start - (a.end - a.start));

  const lanes: number[] = [];
  const clusters: number[] = [];
  const clusterLanes: number[] = [];
  let clusterIndex = -1;
  let clusterEnd = -Infinity;
  let laneEnds: number[] = [];

  sorted.forEach((entry, i) => {
    if (entry.start >= clusterEnd) {
      clusterIndex += 1;
      laneEnds = [];
      clusterLanes[clusterIndex] = 0;
    }
    let lane = laneEnds.findIndex((laneEnd) => laneEnd <= entry.start);
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(entry.end);
    } else {
      laneEnds[lane] = entry.end;
    }
    lanes[i] = lane;
    clusters[i] = clusterIndex;
    clusterLanes[clusterIndex] = Math.max(clusterLanes[clusterIndex], laneEnds.length);
    clusterEnd = Math.max(clusterEnd, entry.end);
  });

  const isOverflow = (i: number) =>
    (clusterLanes[clusters[i]] || 1) > maxLanes && lanes[i] >= maxLanes - 1;

  return sorted.map((entry, i) => {
    const top = rowPos(entry.start);
    const bottom = Math.max(rowPos(entry.end), top + 0.5);
    const totalLanes = clusterLanes[clusters[i]] || 1;
    const overflow = isOverflow(i);
    let overflowGroup: T[] | null = null;

    if (overflow) {
      const sameStretch = sorted
        .map((other, k) => ({ other, k }))
        .filter(
          ({ other, k }) =>
            clusters[k] === clusters[i] && isOverflow(k) && other.start < entry.end && other.end > entry.start
        );
      if (sameStretch[0]?.k === i) overflowGroup = sameStretch.map(({ other }) => other.item);
    }

    return {
      item: entry.item,
      top,
      bottom,
      lane: lanes[i],
      shownLanes: Math.min(totalLanes, maxLanes),
      overflow,
      overflowGroup,
    };
  });
}
