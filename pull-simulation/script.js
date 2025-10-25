// Toggle future resources section
function toggleFutureResources() {
    const checkbox = document.getElementById('includeFuture');
    const futureSection = document.getElementById('futureResources');
    futureSection.style.display = checkbox.checked ? 'block' : 'none';
    updateTotalPulls();
}

// Update total pulls display
function updateTotalPulls() {
    const clearDrops = parseInt(document.getElementById('clearDrops').value) || 0;
    const unilogs = parseInt(document.getElementById('unilogs').value) || 0;
    let totalPulls = Math.floor(clearDrops / 180) + unilogs;
    
    // Add future resources if enabled
    if (document.getElementById('includeFuture').checked) {
        const normalPatches = parseInt(document.getElementById('normalPatches').value) || 0;
        const specialPatches = parseInt(document.getElementById('specialPatches').value) || 0;
        const roaringMonth = parseInt(document.getElementById('roaringMonth').value) || 0;
        const jukebox = parseInt(document.getElementById('jukebox').value) || 0;
        
        totalPulls += (normalPatches * 70) + (specialPatches * 100) + (roaringMonth * 20) + (jukebox * 5);
    }
    
    document.getElementById('totalPulls').textContent = totalPulls;
}

// Add event listeners
document.getElementById('clearDrops').addEventListener('input', updateTotalPulls);
document.getElementById('unilogs').addEventListener('input', updateTotalPulls);
document.getElementById('currentPity').addEventListener('input', updateTotalPulls);
document.getElementById('normalPatches').addEventListener('input', updateTotalPulls);
document.getElementById('specialPatches').addEventListener('input', updateTotalPulls);
document.getElementById('roaringMonth').addEventListener('input', updateTotalPulls);
document.getElementById('jukebox').addEventListener('input', updateTotalPulls);

// Initialize
updateTotalPulls();

class GachaBanner {
    constructor(type, guaranteedRateUp = false, initialPity = 0) {
        this.type = type; // 'normal', 'limited', 'ripple'
        this.pity = initialPity;
        this.guaranteedRateUp = guaranteedRateUp;
    }

    pull() {
        this.pity++;
        let rate = 0.015; // Base 1.5%
        
        // Soft pity starts at pull 61
        if (this.pity >= 61) {
            rate += (this.pity - 60) * 0.025;
        }
        
        // Hard pity at pull 70
        if (this.pity >= 70) {
            rate = 1.0;
        }
        
        const is6Star = Math.random() < rate;
        
        if (is6Star) {
            this.pity = 0;
            
            // Check if it's rate-up
            let isRateUp = false;
            
            if (this.guaranteedRateUp || this.type === 'ripple') {
                isRateUp = true;
                this.guaranteedRateUp = false;
            } else {
                isRateUp = Math.random() < 0.5; // 50/50
                if (!isRateUp) {
                    this.guaranteedRateUp = true; // Next 6* guaranteed rate-up
                }
            }
            
            return { is6Star: true, isRateUp };
        }
        
        return { is6Star: false, isRateUp: false };
    }
}

function simulateSingleRun(totalPulls, normalTargets, limitedTargets, rippleTargets, initialPity, isNextGuaranteed) {
    const normalBanner = new GachaBanner('normal', isNextGuaranteed, initialPity);
    
    let normalGot = 0;
    let limitedGot = 0;
    let rippleGot = 0;
    let pullsUsed = 0;
    
    // First, pull for Ripple targets
    // Each Ripple target gets its own banner where first 6★ is guaranteed rate-up
    for (let i = 0; i < rippleTargets; i++) {
        const rippleBanner = new GachaBanner('ripple', true, 0); // Start fresh, first 6★ guaranteed rate-up
        
        while (pullsUsed < totalPulls) {
            const result = rippleBanner.pull();
            pullsUsed++;
            
            if (result.is6Star && result.isRateUp) {
                rippleGot++;
                break; // Got this Ripple target, move to next
            }
        }
        
        // If we ran out of pulls before getting this Ripple target, stop
        if (rippleGot < i + 1) {
            break;
        }
    }
    
    // Then try to get normal/limited targets
    while (normalGot < normalTargets && pullsUsed < totalPulls) {
        const result = normalBanner.pull();
        pullsUsed++;
        
        if (result.is6Star && result.isRateUp) {
            normalGot++;
        }
    }

    let extraPity = 0;
    while (limitedGot < limitedTargets && pullsUsed < totalPulls) {
        const result = normalBanner.pull();
        pullsUsed++;
        if (result.is6Star && result.isRateUp) {
            limitedGot++;
        }
        extraPity++;
        // Every 200 pulls, guaranteed limited debut
        if (extraPity >= 200) {
            limitedGot++;
            extraPity = 0;
        }
    }
    
    const success = (normalGot >= normalTargets) && (rippleGot >= rippleTargets);
    const pullsLeftover = success ? totalPulls - pullsUsed : 0;
    
    return { success, pullsLeftover, pullsUsed };
}

async function runSimulation() {
    const clearDrops = parseInt(document.getElementById('clearDrops').value) || 0;
    const unilogs = parseInt(document.getElementById('unilogs').value) || 0;
    const currentPity = parseInt(document.getElementById('currentPity').value) || 0;
    const nextGuaranteed = document.getElementById('nextGuaranteed').checked;
    const normalTargets = parseInt(document.getElementById('normalTargets').value) || 0;
    const limitedTargets = parseInt(document.getElementById('limitedTargets').value) || 0;
    const rippleTargets = parseInt(document.getElementById('rippleTargets').value) || 0;
    const simulations = parseInt(document.getElementById('simulations').value) || 10000;
    
    let totalPulls = Math.floor(clearDrops / 180) + unilogs;
    
    // Add future resources if enabled
    if (document.getElementById('includeFuture').checked) {
        const normalPatches = parseInt(document.getElementById('normalPatches').value) || 0;
        const specialPatches = parseInt(document.getElementById('specialPatches').value) || 0;
        const roaringMonth = parseInt(document.getElementById('roaringMonth').value) || 0;
        const jukebox = parseInt(document.getElementById('jukebox').value) || 0;
        
        totalPulls += (normalPatches * 70) + (specialPatches * 100) + (roaringMonth * 20) + (jukebox * 5);
    }
    
    if (totalPulls <= 0) {
        alert('Please enter valid resource values.');
        return;
    }
    
    if (normalTargets <= 0 && rippleTargets <= 0) {
        alert('Please specify at least one target unit.');
        return;
    }
    
    if (currentPity < 0 || currentPity > 69) {
        alert('Current pity must be between 0 and 69.');
        return;
    }
    
    // Show progress
    document.getElementById('progressContainer').style.display = 'block';
    document.getElementById('results').style.display = 'none';
    document.getElementById('detailsCard').style.display = 'none';
    
    let successCount = 0;
    let totalLeftover = 0;
    let pullsUsedData = [];
    
    for (let i = 0; i < simulations; i++) {
        const result = simulateSingleRun(totalPulls, normalTargets, limitedTargets, rippleTargets, currentPity, nextGuaranteed);
        
        if (result.success) {
            successCount++;
            totalLeftover += result.pullsLeftover;
        }
        
        pullsUsedData.push(result.pullsUsed);
        
        // Update progress every 100 simulations
        if (i % 100 === 0) {
            const progress = (i / simulations) * 100;
            document.getElementById('progressBar').style.width = progress + '%';
            document.getElementById('progressText').textContent = `Running simulations... ${i}/${simulations}`;
            
            // Allow UI to update
            await new Promise(resolve => setTimeout(resolve, 1));
        }
    }
    
    // Hide progress
    document.getElementById('progressContainer').style.display = 'none';
    
    // Calculate results
    const successRate = (successCount / simulations) * 100;
    const avgLeftover = successCount > 0 ? Math.round(totalLeftover / successCount) : 0;
    const avgPullsUsed = Math.round(pullsUsedData.reduce((a, b) => a + b, 0) / simulations);
    
    // Display results
    document.getElementById('successRate').textContent = successRate.toFixed(1) + '%';
    document.getElementById('avgLeftover').textContent = successRate === 100 ? avgLeftover : 'N/A';
    
    // Detailed results
    let futureResourcesText = '';
    if (document.getElementById('includeFuture').checked) {
        const normalPatches = parseInt(document.getElementById('normalPatches').value) || 0;
        const specialPatches = parseInt(document.getElementById('specialPatches').value) || 0;
        const roaringMonth = parseInt(document.getElementById('roaringMonth').value) || 0;
        const jukebox = parseInt(document.getElementById('jukebox').value) || 0;
        const futurePulls = (normalPatches * 70) + (specialPatches * 100) + (roaringMonth * 20) + (jukebox * 5);
        futureResourcesText = `<p><strong>Future patch pulls:</strong> ${futurePulls} (${normalPatches} normal + ${specialPatches} special + ${roaringMonth} roaring + ${jukebox} jukebox)</p>`;
    }
    
    const detailsHTML = `
        <div class="row">
            <div class="col-md-6">
                <p><strong>Successful runs:</strong> ${successCount.toLocaleString()} / ${simulations.toLocaleString()}</p>
                <p><strong>Success rate:</strong> ${successRate.toFixed(2)}%</p>
                <p><strong>Average pulls used:</strong> ${avgPullsUsed}</p>
                <p><strong>Starting pity:</strong> ${currentPity}</p>
                <p><strong>Next guaranteed:</strong> ${nextGuaranteed ? 'Yes' : 'No'}</p>
            </div>
            <div class="col-md-6">
                <p><strong>Total pulls available:</strong> ${totalPulls}</p>
                ${futureResourcesText}
                <p><strong>Normal/Limited targets:</strong> ${normalTargets}</p>
                <p><strong>Ripple targets:</strong> ${rippleTargets} (guaranteed)</p>
            </div>
        </div>
    `;
    
    document.getElementById('detailedResults').innerHTML = detailsHTML;
    document.getElementById('results').style.display = 'flex';
    document.getElementById('detailsCard').style.display = 'block';
}