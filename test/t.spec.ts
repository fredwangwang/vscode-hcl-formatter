import * as assert from 'assert';
import { preprocess, postprocess } from '../src/process_levant'

const levantContent = `
resources {
    data = <<EOF
    {{ with $dcs_config" [[ fileContents (print .service_dir "/config.dcs.json") ]] | parseJSON }}
    EOF
    [[ if or .postgres.resources.nfs_host false ]]
        disk = 123
    [[ end ]]
    cpu    = "123[[ env "HOME" ]]"
    memory = 123
    something = [[ .some.thing ]]
    something1 = [[ .some.thing ]]
}
`

describe('', () => {
    it('parse out levant sections', () => {
        const { mapping, content } = preprocess(levantContent);
        const postcontent = postprocess(mapping, content);
        assert.strictEqual(levantContent, postcontent);
    })
})