import {existsSync, mkdirSync, readFileSync, renameSync, writeFileSync} from 'node:fs'
import {dirname} from 'node:path'
import type {GroupChatRoom} from '../types.js'

interface WorkspaceRoomState {rooms: Record<string, GroupChatRoom>}

function cloneRoom(room: GroupChatRoom): GroupChatRoom {
  return structuredClone(room)
}

/** Workspace-owned room state. Stored under the current DSH workspace, never in global host config. */
export class WorkspaceRoomStateStore {
  private data: WorkspaceRoomState = {rooms: {}}

  constructor(private path: string) {
    if (!existsSync(path)) return
    const data = JSON.parse(readFileSync(path, 'utf8'))
    if (!data || typeof data !== 'object' || !data.rooms || typeof data.rooms !== 'object') {
      throw Error('Invalid group-chat workspace room state')
    }
    this.data = {rooms: data.rooms}
  }

  get(roomId: string): GroupChatRoom | undefined {
    const room = this.data.rooms[roomId]
    return room ? cloneRoom(room) : undefined
  }

  all(): GroupChatRoom[] {
    return Object.values(this.data.rooms).map(cloneRoom)
  }

  saveRoom(room: GroupChatRoom): void {
    const next: WorkspaceRoomState = {rooms: {...this.data.rooms, [room.roomId]: cloneRoom(room)}}
    mkdirSync(dirname(this.path), {recursive: true})
    writeFileSync(this.path + '.tmp', JSON.stringify(next, null, 2))
    renameSync(this.path + '.tmp', this.path)
    this.data = next
  }

  location(): string {
    return this.path
  }
}
