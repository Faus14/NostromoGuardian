import { Search, TrendingUp, Users, PieChart, Activity, RefreshCw, ExternalLink } from 'lucide-react';
import { useState } from 'react';
import { 
  analyzeAssetDistribution,
  getAssetFlowAnalysis,
  getIdentityPortfolio,
  AssetIssuanceData
} from '../services/qubic-assets';

type ViewMode = 'distribution' | 'flow' | 'portfolio';

export function AssetAnalyzer() {
  const [viewMode, setViewMode] = useState<ViewMode>('distribution');
  const [loading, setLoading] = useState(false);
  
  // Distribution state
  const [assetName, setAssetName] = useState('CFB');
  const [issuerIdentity, setIssuerIdentity] = useState('QXMRTKAIIGLUREPIQPCMHCKWSIPDTUYFCFNYXQLTECSUJVYEMMDELBMDOEYB');
  const [distribution, setDistribution] = useState<Awaited<ReturnType<typeof analyzeAssetDistribution>> | null>(null);
  
  // Flow state
  const [flowData, setFlowData] = useState<Awaited<ReturnType<typeof getAssetFlowAnalysis>> | null>(null);
  
  // Portfolio state
  const [portfolioIdentity, setPortfolioIdentity] = useState('');
  const [portfolio, setPortfolio] = useState<Awaited<ReturnType<typeof getIdentityPortfolio>> | null>(null);

  const analyzeDistribution = async () => {
    if (!assetName || !issuerIdentity) return;
    setLoading(true);
    try {
      const result = await analyzeAssetDistribution(assetName, issuerIdentity);
      setDistribution(result);
    } catch (error) {
      console.error('Failed to analyze distribution:', error);
    } finally {
      setLoading(false);
    }
  };

  const analyzeFlow = async () => {
    if (!assetName || !issuerIdentity) return;
    setLoading(true);
    try {
      const result = await getAssetFlowAnalysis(assetName, issuerIdentity);
      setFlowData(result);
    } catch (error) {
      console.error('Failed to analyze flow:', error);
    } finally {
      setLoading(false);
    }
  };

  const analyzePortfolio = async () => {
    if (!portfolioIdentity) return;
    setLoading(true);
    try {
      const result = await getIdentityPortfolio(portfolioIdentity);
      setPortfolio(result);
    } catch (error) {
      console.error('Failed to analyze portfolio:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Mode Tabs */}
      <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-5 h-5 text-[#00F5FF]" />
          <h3 className="text-white font-semibold">Asset Explorer</h3>
          <span className="text-white/60 text-sm ml-auto">🔴 Live from Qubic RPC</span>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('distribution')}
            className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-all ${
              viewMode === 'distribution'
                ? 'bg-[#00F5FF] text-black'
                : 'bg-white/5 text-white/60 hover:bg-white/10'
            }`}
          >
            <PieChart className="w-4 h-4 inline mr-2" />
            Distribution
          </button>
          <button
            onClick={() => setViewMode('flow')}
            className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-all ${
              viewMode === 'flow'
                ? 'bg-[#00F5FF] text-black'
                : 'bg-white/5 text-white/60 hover:bg-white/10'
            }`}
          >
            <TrendingUp className="w-4 h-4 inline mr-2" />
            Flow
          </button>
          <button
            onClick={() => setViewMode('portfolio')}
            className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-all ${
              viewMode === 'portfolio'
                ? 'bg-[#00F5FF] text-black'
                : 'bg-white/5 text-white/60 hover:bg-white/10'
            }`}
          >
            <Users className="w-4 h-4 inline mr-2" />
            Portfolio
          </button>
        </div>
      </div>

      {/* Distribution View */}
      {viewMode === 'distribution' && (
        <>
          <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20 rounded-xl p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-white/60 text-sm mb-2 block">Asset Name</label>
                <input
                  type="text"
                  value={assetName}
                  onChange={(e) => setAssetName(e.target.value.toUpperCase())}
                  placeholder="CFB"
                  className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-[#00F5FF]"
                />
              </div>
              <div>
                <label className="text-white/60 text-sm mb-2 block">Issuer Identity</label>
                <input
                  type="text"
                  value={issuerIdentity}
                  onChange={(e) => setIssuerIdentity(e.target.value)}
                  placeholder="Issuer public key..."
                  className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-[#00F5FF] font-mono text-xs"
                />
              </div>
            </div>
            <button
              onClick={analyzeDistribution}
              disabled={loading || !assetName || !issuerIdentity}
              className="w-full px-6 py-2 bg-[#00F5FF] hover:bg-[#00D5DF] text-black font-semibold rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              {loading ? 'Analyzing...' : 'Analyze Distribution'}
            </button>
          </div>

          {distribution && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/30 rounded-xl p-4">
                  <Users className="w-5 h-5 text-blue-400 mb-2" />
                  <p className="text-white/60 text-sm">Total Holders</p>
                  <p className="text-white text-3xl font-bold">{distribution.totalHolders}</p>
                </div>
                <div className="bg-gradient-to-br from-green-500/20 to-green-600/10 border border-green-500/30 rounded-xl p-4">
                  <TrendingUp className="w-5 h-5 text-green-400 mb-2" />
                  <p className="text-white/60 text-sm">Total Supply</p>
                  <p className="text-white text-2xl font-bold">{distribution.totalSupply.toString()}</p>
                </div>
                <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 border border-purple-500/30 rounded-xl p-4">
                  <PieChart className="w-5 h-5 text-purple-400 mb-2" />
                  <p className="text-white/60 text-sm">Top 10 Holdings</p>
                  <p className="text-white text-3xl font-bold">{distribution.concentration.top10.toFixed(1)}%</p>
                </div>
                <div className="bg-gradient-to-br from-cyan-500/20 to-cyan-600/10 border border-cyan-500/30 rounded-xl p-4">
                  <Activity className="w-5 h-5 text-cyan-400 mb-2" />
                  <p className="text-white/60 text-sm">HHI Index</p>
                  <p className="text-white text-2xl font-bold">{distribution.concentration.herfindahlIndex.toFixed(0)}</p>
                </div>
              </div>

              <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20 rounded-xl p-6">
                <h3 className="text-white font-semibold mb-4">Holder Distribution</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <p className="text-red-400 text-3xl font-bold">{distribution.distribution.whales}</p>
                    <p className="text-white/60 text-sm mt-1">Whales (&gt;5%)</p>
                  </div>
                  <div className="text-center p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                    <p className="text-orange-400 text-3xl font-bold">{distribution.distribution.large}</p>
                    <p className="text-white/60 text-sm mt-1">Large (1-5%)</p>
                  </div>
                  <div className="text-center p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                    <p className="text-yellow-400 text-3xl font-bold">{distribution.distribution.medium}</p>
                    <p className="text-white/60 text-sm mt-1">Medium (0.1-1%)</p>
                  </div>
                  <div className="text-center p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <p className="text-green-400 text-3xl font-bold">{distribution.distribution.small}</p>
                    <p className="text-white/60 text-sm mt-1">Small (&lt;0.1%)</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20 rounded-xl p-6">
                <h3 className="text-white font-semibold mb-4">Top 20 Holders</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10 text-white/60 text-xs uppercase">
                        <th className="text-left py-3 px-2">Rank</th>
                        <th className="text-left py-3 px-2">Address</th>
                        <th className="text-right py-3 px-2">Balance</th>
                        <th className="text-right py-3 px-2">Percentage</th>
                        <th className="text-right py-3 px-2">Contract</th>
                      </tr>
                    </thead>
                    <tbody>
                      {distribution.holders.slice(0, 20).map((holder, idx) => (
                        <tr key={holder.address} className="border-b border-white/5 hover:bg-white/5 transition-all">
                          <td className="py-3 px-2 text-white/80 font-bold">#{idx + 1}</td>
                          <td className="py-3 px-2 text-white/80 font-mono text-xs">
                            {holder.address.substring(0, 12)}...{holder.address.substring(holder.address.length - 6)}
                          </td>
                          <td className="py-3 px-2 text-right text-white font-semibold">
                            {holder.balance.toString()}
                          </td>
                          <td className="py-3 px-2 text-right">
                            <span className={`font-bold ${
                              holder.percentage >= 5 ? 'text-red-400' :
                              holder.percentage >= 1 ? 'text-orange-400' :
                              holder.percentage >= 0.1 ? 'text-yellow-400' :
                              'text-green-400'
                            }`}>
                              {holder.percentage.toFixed(2)}%
                            </span>
                          </td>
                          <td className="py-3 px-2 text-right text-white/60">
                            {holder.managingContract}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </>
      )}

      {/* Flow View */}
      {viewMode === 'flow' && (
        <>
          <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20 rounded-xl p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-white/60 text-sm mb-2 block">Asset Name</label>
                <input
                  type="text"
                  value={assetName}
                  onChange={(e) => setAssetName(e.target.value.toUpperCase())}
                  placeholder="CFB"
                  className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-[#00F5FF]"
                />
              </div>
              <div>
                <label className="text-white/60 text-sm mb-2 block">Issuer Identity</label>
                <input
                  type="text"
                  value={issuerIdentity}
                  onChange={(e) => setIssuerIdentity(e.target.value)}
                  placeholder="Issuer public key..."
                  className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-[#00F5FF] font-mono text-xs"
                />
              </div>
            </div>
            <button
              onClick={analyzeFlow}
              disabled={loading || !assetName || !issuerIdentity}
              className="w-full px-6 py-2 bg-[#00F5FF] hover:bg-[#00D5DF] text-black font-semibold rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              {loading ? 'Analyzing...' : 'Analyze Flow'}
            </button>
          </div>

          {flowData && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/30 rounded-xl p-4">
                  <Users className="w-5 h-5 text-blue-400 mb-2" />
                  <p className="text-white/60 text-sm">Total Owners</p>
                  <p className="text-white text-3xl font-bold">{flowData.totalOwners}</p>
                </div>
                <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 border border-purple-500/30 rounded-xl p-4">
                  <TrendingUp className="w-5 h-5 text-purple-400 mb-2" />
                  <p className="text-white/60 text-sm">Total Possessors</p>
                  <p className="text-white text-3xl font-bold">{flowData.totalPossessors}</p>
                </div>
                <div className="bg-gradient-to-br from-cyan-500/20 to-cyan-600/10 border border-cyan-500/30 rounded-xl p-4">
                  <Activity className="w-5 h-5 text-cyan-400 mb-2" />
                  <p className="text-white/60 text-sm">Active Contracts</p>
                  <p className="text-white text-3xl font-bold">{flowData.crossContractActivity.length}</p>
                </div>
              </div>

              {flowData.assetInfo && (
                <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20 rounded-xl p-6">
                  <h3 className="text-white font-semibold mb-4">Asset Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-white/60 text-sm">Name</p>
                      <p className="text-white font-mono">{flowData.assetInfo.name}</p>
                    </div>
                    <div>
                      <p className="text-white/60 text-sm">Issuer</p>
                      <p className="text-white font-mono text-xs">
                        {flowData.assetInfo.issuerIdentity.substring(0, 12)}...
                      </p>
                    </div>
                    <div>
                      <p className="text-white/60 text-sm">Decimals</p>
                      <p className="text-white">{flowData.assetInfo.numberOfDecimalPlaces}</p>
                    </div>
                    <div>
                      <p className="text-white/60 text-sm">Type</p>
                      <p className="text-white">{flowData.assetInfo.type}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20 rounded-xl p-6">
                <h3 className="text-white font-semibold mb-4">Cross-Contract Activity</h3>
                <div className="space-y-3">
                  {flowData.crossContractActivity.map((activity) => (
                    <div key={activity.contractIndex} className="bg-white/5 border border-white/10 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-white font-semibold">Contract {activity.contractIndex}</p>
                          <p className="text-white/60 text-sm">
                            {activity.ownerships} ownerships · {activity.possessions} possessions
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[#00F5FF] font-bold">{activity.ownerships + activity.possessions}</p>
                          <p className="text-white/60 text-xs">Total Activity</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </>
      )}

      {/* Portfolio View */}
      {viewMode === 'portfolio' && (
        <>
          <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20 rounded-xl p-6">
            <div className="mb-4">
              <label className="text-white/60 text-sm mb-2 block">Identity Address</label>
              <input
                type="text"
                value={portfolioIdentity}
                onChange={(e) => setPortfolioIdentity(e.target.value)}
                placeholder="Enter identity public key..."
                className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-[#00F5FF] font-mono text-xs"
              />
            </div>
            <button
              onClick={analyzePortfolio}
              disabled={loading || !portfolioIdentity}
              className="w-full px-6 py-2 bg-[#00F5FF] hover:bg-[#00D5DF] text-black font-semibold rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              {loading ? 'Loading...' : 'Load Portfolio'}
            </button>
          </div>

          {portfolio && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/30 rounded-xl p-4">
                  <TrendingUp className="w-5 h-5 text-blue-400 mb-2" />
                  <p className="text-white/60 text-sm">Assets Issued</p>
                  <p className="text-white text-3xl font-bold">{portfolio.issued.length}</p>
                </div>
                <div className="bg-gradient-to-br from-green-500/20 to-green-600/10 border border-green-500/30 rounded-xl p-4">
                  <Users className="w-5 h-5 text-green-400 mb-2" />
                  <p className="text-white/60 text-sm">Assets Owned</p>
                  <p className="text-white text-3xl font-bold">{portfolio.owned.length}</p>
                </div>
                <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 border border-purple-500/30 rounded-xl p-4">
                  <PieChart className="w-5 h-5 text-purple-400 mb-2" />
                  <p className="text-white/60 text-sm">Total Asset Types</p>
                  <p className="text-white text-3xl font-bold">{portfolio.totalAssetTypes}</p>
                </div>
              </div>

              {portfolio.owned.length > 0 && (
                <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm border border-white/20 rounded-xl p-6">
                  <h3 className="text-white font-semibold mb-4">Owned Assets</h3>
                  <div className="space-y-3">
                    {portfolio.owned.map((asset, idx) => (
                      <div key={idx} className="bg-white/5 border border-white/10 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-white font-semibold font-mono">{asset.data.issuedAsset.name}</p>
                            <p className="text-white/60 text-sm">
                              Contract {asset.data.managingContractIndex}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-[#00F5FF] font-bold text-xl">{asset.data.numberOfUnits}</p>
                            <p className="text-white/60 text-xs">units</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
