resources {
  // [[ if or .aaa false ]]
  disk = 123
  // [[ end ]]
  cpu       = "123[[ env 'HOME' ]]"
  memory    = 123
  something = [[ .some.thing ]]
  a         = [[ if (env "ASDF") ]]"true"[[ else ]]"false"[[ end ]]
}
