let _leaveDetailId: string | null = null;
let _editLeaveId: string | null = null;

export function setLeaveDetailId(id: string) {
  _leaveDetailId = id;
}

export function getLeaveDetailId(): string | null {
  const id = _leaveDetailId;
  _leaveDetailId = null;
  return id;
}

export function setEditLeaveId(id: string) {
  _editLeaveId = id;
}

export function getEditLeaveId(): string | null {
  const id = _editLeaveId;
  _editLeaveId = null;
  return id;
}
