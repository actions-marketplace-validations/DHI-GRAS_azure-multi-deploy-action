import { exec } from 'child-process-promise'
import * as github from '@actions/github'
import { Package } from './types'
import getChangedPackages from './functions/get-changed-packages'

const commitSha = github.context.sha.substr(0, 7)

const deployWebApp = async (pkg: Package) => {
	console.log(`Building webapp: ${pkg.name}`)
	const { stdout, stderr } = await exec(
		`cd ${pkg.path} && COMMIT_SHA=${commitSha} yarn ${pkg.name}:build`,
	)
	if (stderr) console.log(stderr, stdout)

	console.log(`Build finished, uploading webapp: ${pkg.name}`)

	await exec('az extension add --name storage-preview').catch()
	await exec(
		`cd ${pkg.path}/ && az storage blob upload-batch --source ./dist --destination \\$web --account-name ${pkg.id} --auth-mode key`,
	).catch((err) => {
		throw Error(err)
	})
}

const deployFuncApp = async (pkg: Package) => {
	try {
		console.log(`Deploying functionapp: ${pkg.name}`)
		await exec(`cd ${pkg.path} && yarn build && zip -r dist.zip *`)

		const { stderr: uploadErr } = await exec(
			`cd ${pkg.path} && az functionapp deployment source config-zip -g ${pkg.resourceGroup} -n ${pkg.id} --src dist.zip`,
		)

		if (uploadErr) console.log(uploadErr)
		console.log(`Deployed functionapp: ${pkg.id}`)
	} catch (err) {
		console.log(`ERROR: could not deploy ${pkg.id} - ${String(err)}`)
	}
}

const deployToProd = async (): Promise<void> => {
	const changedPackages = await getChangedPackages()

	const webPackages = changedPackages.filter((pkg) => pkg.type === 'app')
	const funcPackages = changedPackages.filter((pkg) => pkg.type === 'func-api')

	const allPackages = [...webPackages, ...funcPackages]

	for (const pkg of allPackages) {
		if (pkg.type === 'app') await deployWebApp(pkg)
		if (pkg.type === 'func-api') await deployFuncApp(pkg)
	}
}

export default deployToProd
