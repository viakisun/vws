<script lang="ts">
	import { themeManager, currentTheme, isDark, isAuto } from '$lib/stores/theme';
	import ThemeToggle from './ThemeToggle.svelte';

	// Sample data for demonstration
	const sampleData = {
		projects: [
			{ name: 'AI Research Project', status: 'active', progress: 75 },
			{ name: 'Mobile App Development', status: 'completed', progress: 100 },
			{ name: 'Data Analysis Tool', status: 'pending', progress: 30 }
		],
		metrics: {
			totalProjects: 12,
			activeProjects: 8,
			completedProjects: 4,
			teamMembers: 15
		}
	};

	// Get status color
	function getStatusColor(status: string): string {
		switch (status) {
			case 'active': return 'var(--color-success)';
			case 'completed': return 'var(--color-primary)';
			case 'pending': return 'var(--color-warning)';
			default: return 'var(--color-text-secondary)';
		}
	}

	// Get status label
	function getStatusLabel(status: string): string {
		switch (status) {
			case 'active': return 'Active';
			case 'completed': return 'Completed';
			case 'pending': return 'Pending';
			default: return 'Unknown';
		}
	}
</script>

<div class="theme-demo">
	<!-- Header -->
	<div class="demo-header">
		<div class="demo-header-content">
			<h1 class="demo-title">Theme System Demo</h1>
			<p class="demo-subtitle">Experience the power of our dynamic theme system</p>
		</div>
		<div class="demo-header-actions">
			<ThemeToggle />
		</div>
	</div>

	<!-- Theme Info -->
	<div class="demo-info">
		<div class="demo-info-card">
			<div class="demo-info-header">
				<span class="demo-info-icon">🎨</span>
				<h3 class="demo-info-title">Current Theme</h3>
			</div>
			<div class="demo-info-content">
				<p class="demo-info-text">
					<strong>Mode:</strong> {$currentTheme}
				</p>
				<p class="demo-info-text">
					<strong>Dark Mode:</strong> {$isDark ? 'Yes' : 'No'}
				</p>
				<p class="demo-info-text">
					<strong>Auto Mode:</strong> {$isAuto ? 'Yes' : 'No'}
				</p>
			</div>
		</div>
	</div>

	<!-- Color Palette -->
	<div class="demo-section">
		<h2 class="demo-section-title">Color Palette</h2>
		<div class="color-palette">
			<div class="color-group">
				<h4 class="color-group-title">Primary Colors</h4>
				<div class="color-swatches">
					<div class="color-swatch">
						<div class="color-swatch-color" style="background: var(--color-primary);"></div>
						<span class="color-swatch-label">Primary</span>
					</div>
					<div class="color-swatch">
						<div class="color-swatch-color" style="background: var(--color-success);"></div>
						<span class="color-swatch-label">Success</span>
					</div>
					<div class="color-swatch">
						<div class="color-swatch-color" style="background: var(--color-warning);"></div>
						<span class="color-swatch-label">Warning</span>
					</div>
					<div class="color-swatch">
						<div class="color-swatch-color" style="background: var(--color-error);"></div>
						<span class="color-swatch-label">Error</span>
					</div>
					<div class="color-swatch">
						<div class="color-swatch-color" style="background: var(--color-info);"></div>
						<span class="color-swatch-label">Info</span>
					</div>
				</div>
			</div>
			
			<div class="color-group">
				<h4 class="color-group-title">Surface Colors</h4>
				<div class="color-swatches">
					<div class="color-swatch">
						<div class="color-swatch-color" style="background: var(--color-background);"></div>
						<span class="color-swatch-label">Background</span>
					</div>
					<div class="color-swatch">
						<div class="color-swatch-color" style="background: var(--color-surface);"></div>
						<span class="color-swatch-label">Surface</span>
					</div>
					<div class="color-swatch">
						<div class="color-swatch-color" style="background: var(--color-surface-elevated);"></div>
						<span class="color-swatch-label">Elevated</span>
					</div>
					<div class="color-swatch">
						<div class="color-swatch-color" style="background: var(--color-border);"></div>
						<span class="color-swatch-label">Border</span>
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Component Examples -->
	<div class="demo-section">
		<h2 class="demo-section-title">Component Examples</h2>
		
		<!-- Buttons -->
		<div class="demo-subsection">
			<h3 class="demo-subsection-title">Buttons</h3>
			<div class="button-group">
				<button class="btn btn-primary">Primary Button</button>
				<button class="btn btn-secondary">Secondary Button</button>
				<button class="btn btn-success">Success Button</button>
				<button class="btn btn-warning">Warning Button</button>
				<button class="btn btn-error">Error Button</button>
				<button class="btn btn-info">Info Button</button>
			</div>
		</div>

		<!-- Cards -->
		<div class="demo-subsection">
			<h3 class="demo-subsection-title">Cards</h3>
			<div class="card-grid">
				{#each sampleData.projects as project}
					<div class="demo-card">
						<div class="demo-card-header">
							<h4 class="demo-card-title">{project.name}</h4>
							<span class="demo-card-status" style="color: {getStatusColor(project.status)};">
								{getStatusLabel(project.status)}
							</span>
						</div>
						<div class="demo-card-content">
							<div class="progress-bar">
								<div class="progress-fill" style="width: {project.progress}%; background: var(--color-primary);"></div>
							</div>
							<p class="demo-card-text">Progress: {project.progress}%</p>
						</div>
					</div>
				{/each}
			</div>
		</div>

		<!-- Forms -->
		<div class="demo-subsection">
			<h3 class="demo-subsection-title">Form Elements</h3>
			<div class="form-demo">
				<div class="form-group">
					<label class="form-label">Project Name</label>
					<input type="text" class="form-input" placeholder="Enter project name" />
				</div>
				<div class="form-group">
					<label class="form-label">Description</label>
					<textarea class="form-textarea" placeholder="Enter project description"></textarea>
				</div>
				<div class="form-group">
					<label class="form-label">Priority</label>
					<select class="form-select">
						<option>High</option>
						<option>Medium</option>
						<option>Low</option>
					</select>
				</div>
			</div>
		</div>

		<!-- Tables -->
		<div class="demo-subsection">
			<h3 class="demo-subsection-title">Tables</h3>
			<div class="table-demo">
				<table class="demo-table">
					<thead>
						<tr>
							<th>Project</th>
							<th>Status</th>
							<th>Progress</th>
							<th>Team</th>
						</tr>
					</thead>
					<tbody>
						{#each sampleData.projects as project}
							<tr>
								<td>{project.name}</td>
								<td>
									<span class="status-badge" style="background: {getStatusColor(project.status)};">
										{getStatusLabel(project.status)}
									</span>
								</td>
								<td>{project.progress}%</td>
								<td>5 members</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>

		<!-- Metrics -->
		<div class="demo-subsection">
			<h3 class="demo-subsection-title">Metrics & Stats</h3>
			<div class="metrics-grid">
				<div class="metric-card">
					<div class="metric-icon">📊</div>
					<div class="metric-content">
						<div class="metric-value">{sampleData.metrics.totalProjects}</div>
						<div class="metric-label">Total Projects</div>
					</div>
				</div>
				<div class="metric-card">
					<div class="metric-icon">🚀</div>
					<div class="metric-content">
						<div class="metric-value">{sampleData.metrics.activeProjects}</div>
						<div class="metric-label">Active Projects</div>
					</div>
				</div>
				<div class="metric-card">
					<div class="metric-icon">✅</div>
					<div class="metric-content">
						<div class="metric-value">{sampleData.metrics.completedProjects}</div>
						<div class="metric-label">Completed</div>
					</div>
				</div>
				<div class="metric-card">
					<div class="metric-icon">👥</div>
					<div class="metric-content">
						<div class="metric-value">{sampleData.metrics.teamMembers}</div>
						<div class="metric-label">Team Members</div>
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Theme Features -->
	<div class="demo-section">
		<h2 class="demo-section-title">Theme Features</h2>
		<div class="features-grid">
			<div class="feature-card">
				<div class="feature-icon">🌓</div>
				<h4 class="feature-title">Auto Theme</h4>
				<p class="feature-description">Automatically switches between light and dark themes based on system preferences.</p>
			</div>
			<div class="feature-card">
				<div class="feature-icon">🎨</div>
				<h4 class="feature-title">Dynamic Colors</h4>
				<p class="feature-description">All colors are dynamically generated and optimized for each theme mode.</p>
			</div>
			<div class="feature-card">
				<div class="feature-icon">⚡</div>
				<h4 class="feature-title">Instant Switching</h4>
				<p class="feature-description">Smooth transitions between themes with no page reload required.</p>
			</div>
			<div class="feature-card">
				<div class="feature-icon">💾</div>
				<h4 class="feature-title">Persistent Settings</h4>
				<p class="feature-description">Your theme preference is saved and restored across sessions.</p>
			</div>
		</div>
	</div>
</div>

<style>
	.theme-demo {
		max-width: 1200px;
		margin: 0 auto;
		padding: 24px;
		background: var(--color-background);
		color: var(--color-text);
		min-height: 100vh;
	}

	.demo-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 32px;
		padding-bottom: 24px;
		border-bottom: 1px solid var(--color-border);
	}

	.demo-title {
		font-size: 32px;
		font-weight: 700;
		margin: 0 0 8px 0;
		color: var(--color-text);
	}

	.demo-subtitle {
		font-size: 16px;
		color: var(--color-text-secondary);
		margin: 0;
	}

	.demo-info {
		margin-bottom: 32px;
	}

	.demo-info-card {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: 12px;
		padding: 20px;
	}

	.demo-info-header {
		display: flex;
		align-items: center;
		gap: 12px;
		margin-bottom: 16px;
	}

	.demo-info-icon {
		font-size: 24px;
	}

	.demo-info-title {
		font-size: 18px;
		font-weight: 600;
		margin: 0;
		color: var(--color-text);
	}

	.demo-info-content {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 12px;
	}

	.demo-info-text {
		margin: 0;
		font-size: 14px;
		color: var(--color-text-secondary);
	}

	.demo-section {
		margin-bottom: 48px;
	}

	.demo-section-title {
		font-size: 24px;
		font-weight: 600;
		margin: 0 0 24px 0;
		color: var(--color-text);
	}

	.demo-subsection {
		margin-bottom: 32px;
	}

	.demo-subsection-title {
		font-size: 18px;
		font-weight: 600;
		margin: 0 0 16px 0;
		color: var(--color-text);
	}

	.color-palette {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 24px;
	}

	.color-group {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: 12px;
		padding: 20px;
	}

	.color-group-title {
		font-size: 16px;
		font-weight: 600;
		margin: 0 0 16px 0;
		color: var(--color-text);
	}

	.color-swatches {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
		gap: 16px;
	}

	.color-swatch {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 8px;
	}

	.color-swatch-color {
		width: 60px;
		height: 60px;
		border-radius: 8px;
		border: 1px solid var(--color-border);
	}

	.color-swatch-label {
		font-size: 12px;
		font-weight: 500;
		color: var(--color-text-secondary);
		text-align: center;
	}

	.button-group {
		display: flex;
		flex-wrap: wrap;
		gap: 12px;
	}

	.btn {
		padding: 10px 20px;
		border: none;
		border-radius: 8px;
		font-size: 14px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.btn-primary {
		background: var(--color-primary);
		color: white;
	}

	.btn-primary:hover {
		background: var(--color-primary-hover);
	}

	.btn-secondary {
		background: var(--color-button-secondary);
		color: white;
	}

	.btn-secondary:hover {
		background: var(--color-button-secondary-hover);
	}

	.btn-success {
		background: var(--color-button-success);
		color: white;
	}

	.btn-success:hover {
		background: var(--color-button-success-hover);
	}

	.btn-warning {
		background: var(--color-button-warning);
		color: #212529;
	}

	.btn-warning:hover {
		background: var(--color-button-warning-hover);
	}

	.btn-error {
		background: var(--color-button-error);
		color: white;
	}

	.btn-error:hover {
		background: var(--color-button-error-hover);
	}

	.btn-info {
		background: var(--color-button-info);
		color: white;
	}

	.btn-info:hover {
		background: var(--color-button-info-hover);
	}

	.card-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 20px;
	}

	.demo-card {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: 12px;
		padding: 20px;
		transition: all 0.2s ease;
	}

	.demo-card:hover {
		background: var(--color-surface-elevated);
		box-shadow: 0 4px 12px var(--color-shadow-light);
	}

	.demo-card-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 16px;
	}

	.demo-card-title {
		font-size: 16px;
		font-weight: 600;
		margin: 0;
		color: var(--color-text);
	}

	.demo-card-status {
		font-size: 12px;
		font-weight: 500;
		padding: 4px 8px;
		border-radius: 4px;
		background: var(--color-surface-elevated);
	}

	.demo-card-content {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.progress-bar {
		width: 100%;
		height: 8px;
		background: var(--color-border);
		border-radius: 4px;
		overflow: hidden;
	}

	.progress-fill {
		height: 100%;
		transition: width 0.3s ease;
	}

	.demo-card-text {
		margin: 0;
		font-size: 14px;
		color: var(--color-text-secondary);
	}

	.form-demo {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 20px;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.form-label {
		font-size: 14px;
		font-weight: 500;
		color: var(--color-text);
	}

	.form-input,
	.form-textarea,
	.form-select {
		padding: 10px 12px;
		background: var(--color-input-background);
		border: 1px solid var(--color-input-border);
		border-radius: 8px;
		font-size: 14px;
		color: var(--color-text);
		transition: all 0.2s ease;
	}

	.form-input:focus,
	.form-textarea:focus,
	.form-select:focus {
		outline: none;
		border-color: var(--color-input-focus);
		box-shadow: 0 0 0 2px var(--color-primary-light);
	}

	.form-textarea {
		resize: vertical;
		min-height: 80px;
	}

	.table-demo {
		overflow-x: auto;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: 12px;
	}

	.demo-table {
		width: 100%;
		border-collapse: collapse;
	}

	.demo-table th,
	.demo-table td {
		padding: 12px 16px;
		text-align: left;
		border-bottom: 1px solid var(--color-border);
	}

	.demo-table th {
		background: var(--color-table-header);
		font-weight: 600;
		color: var(--color-text);
		font-size: 14px;
	}

	.demo-table td {
		color: var(--color-text-secondary);
		font-size: 14px;
	}

	.demo-table tbody tr:hover {
		background: var(--color-table-row-hover);
	}

	.status-badge {
		padding: 4px 8px;
		border-radius: 4px;
		font-size: 12px;
		font-weight: 500;
		color: white;
	}

	.metrics-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 20px;
	}

	.metric-card {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: 12px;
		padding: 20px;
		display: flex;
		align-items: center;
		gap: 16px;
		transition: all 0.2s ease;
	}

	.metric-card:hover {
		background: var(--color-surface-elevated);
		box-shadow: 0 4px 12px var(--color-shadow-light);
	}

	.metric-icon {
		font-size: 24px;
	}

	.metric-content {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.metric-value {
		font-size: 24px;
		font-weight: 700;
		color: var(--color-text);
	}

	.metric-label {
		font-size: 14px;
		color: var(--color-text-secondary);
	}

	.features-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 20px;
	}

	.feature-card {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: 12px;
		padding: 20px;
		text-align: center;
		transition: all 0.2s ease;
	}

	.feature-card:hover {
		background: var(--color-surface-elevated);
		box-shadow: 0 4px 12px var(--color-shadow-light);
	}

	.feature-icon {
		font-size: 32px;
		margin-bottom: 12px;
	}

	.feature-title {
		font-size: 16px;
		font-weight: 600;
		margin: 0 0 8px 0;
		color: var(--color-text);
	}

	.feature-description {
		font-size: 14px;
		color: var(--color-text-secondary);
		margin: 0;
		line-height: 1.5;
	}

	/* Responsive design */
	@media (max-width: 768px) {
		.theme-demo {
			padding: 16px;
		}

		.demo-header {
			flex-direction: column;
			align-items: flex-start;
			gap: 16px;
		}

		.demo-title {
			font-size: 24px;
		}

		.color-swatches {
			grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
		}

		.button-group {
			flex-direction: column;
		}

		.card-grid {
			grid-template-columns: 1fr;
		}

		.form-demo {
			grid-template-columns: 1fr;
		}

		.metrics-grid {
			grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
		}

		.features-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
