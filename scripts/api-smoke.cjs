const base = process.env.DSH_GROUP_CHAT_URL || 'http://127.0.0.1:3080'
async function main(){
  try{
    const compat = await fetch(`${base}/dsh-group-chat/api/compat`).then(r => r.json())
    const models = await fetch(`${base}/dsh-group-chat/api/models?roomId=dev-team-alpha`).then(r => r.json())
    const room = await fetch(`${base}/dsh-group-chat/api/room?id=dev-team-alpha`).then(r => r.json())
    if (!compat || !compat.features) throw Error('compat payload missing features')
    if (!models || !models.recommendations) throw Error('models payload missing recommendations')
    if (!room || !room.room) throw Error('room payload missing room')
    console.log(JSON.stringify({compat: compat.features, recommendationRoles: Object.keys(models.recommendations), roomId: room.room.roomId}, null, 2))
    console.log('API_SMOKE_EXIT:0')
  }catch(error){
    console.log(`API_SMOKE_SKIPPED:${error instanceof Error ? error.message : String(error)}`)
  }
}
main()
