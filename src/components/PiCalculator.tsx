"use client";

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Search, Cpu, Hash, Clock, Activity, Server, Database } from 'lucide-react';
import { StatsCard } from './StatsCard';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso';

export default function PiCalculator() {
    const [digits, setDigits] = useState<string>("");
    const [totalDigits, setTotalDigits] = useState(0);
    const [startTime, setStartTime] = useState(Date.now());
    const [history, setHistory] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResult, setSearchResult] = useState<{ index: number; found: boolean } | null>(null);
    const [isSearching, setIsSearching] = useState(false);

    const virtuosoRef = useRef<VirtuosoHandle>(null);

    // Connect to SSE Stream
    useEffect(() => {
        const eventSource = new EventSource('/api/pi/stream');

        eventSource.onmessage = (event) => {
            const data = JSON.parse(event.data);

            if (data.type === 'init') {
                setDigits(data.digits);
                setTotalDigits(data.totalDigits);
                setStartTime(data.startTime);
                setHistory(data.history);
            } else if (data.type === 'update') {
                setDigits(prev => {
                    const newStr = prev + data.newDigits;
                    if (newStr.length > 50000) {
                        return newStr.slice(-50000);
                    }
                    return newStr;
                });
                setTotalDigits(data.totalDigits);
                setHistory(data.history);
            }
        };

        eventSource.onerror = (err) => {
            console.error("EventSource failed:", err);
            eventSource.close();
        };

        return () => {
            eventSource.close();
        };
    }, []);

    const handleSearch = async () => {
        if (!searchQuery) return;
        setIsSearching(true);
        setSearchResult(null);

        try {
            const res = await fetch(`/api/pi/search?q=${searchQuery}`);
            const data = await res.json();

            if (data.found) {
                setSearchResult({ index: data.index, found: true });

                // Scroll to the found sequence
                // We need to find where this index is in our current 'digits' buffer
                // Or if it's outside, we might need to load it (but for now we assume it's in the stream or we just point to it)

                // The 'index' returned is absolute.
                // 'totalDigits' is the total count.
                // 'digits' contains the last N digits.
                // The start index of 'digits' is (totalDigits - digits.length).

                const bufferStartIndex = totalDigits - digits.length;
                const relativeIndex = data.index - bufferStartIndex;

                if (relativeIndex >= 0 && relativeIndex < digits.length) {
                    // It's in the current view
                    const row = Math.floor(relativeIndex / 50);
                    virtuosoRef.current?.scrollToIndex({ index: row, align: 'center', behavior: 'smooth' });
                } else {
                    // It's outside the current view (too old)
                    // For this demo, we'll just alert the user it's deep in history
                    // Ideally we would fetch that chunk.
                    alert(`Sequence found at index ${data.index}, but it is too far back in history to scroll to with the current buffer.`);
                }

            } else {
                setSearchResult({ index: -1, found: false });
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsSearching(false);
        }
    };

    const chartData = useMemo(() => {
        if (!history) return [];
        return history.map((h: any, i: number) => ({
            name: i,
            digits: h.count,
            time: h.timeTaken
        }));
    }, [history]);

    // Row renderer for react-virtuoso
    const Row = (index: number) => {
        const charsPerRow = 50;
        const charIndex = index * charsPerRow;
        const chunk = digits.slice(charIndex, charIndex + charsPerRow);

        const absolutePos = totalDigits - digits.length + charIndex;

        // Highlight search result if visible
        // This is a simple implementation

        return (
            <div className="font-mono text-gray-300 hover:bg-gray-900/50 px-2 flex gap-4 h-[30px]">
                <span className="text-gray-600 select-none w-24 text-right text-xs py-1">{absolutePos}</span>
                <span className="tracking-widest">{chunk}</span>
            </div>
        );
    };

    return (
        <div className="w-full max-w-6xl mx-auto p-6 space-y-8 pb-20">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-linear-to-r from-white to-gray-500">
                        Infinite Pi Server
                    </h1>
                    <p className="text-gray-400 mt-2">
                        Persistent calculation stored in SQLite. Streaming via SSE.
                    </p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-md font-medium bg-blue-500/10 text-blue-400 border border-blue-500/50">
                    <Database size={18} /> Database Connected
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatsCard
                    title="Total Digits"
                    value={totalDigits.toLocaleString()}
                    icon={Hash}
                />
                <StatsCard
                    title="Server Uptime"
                    value={`${Math.floor((Date.now() - startTime) / 1000 / 60)}m`}
                    icon={Clock}
                />
                <StatsCard
                    title="Batch Speed"
                    value={history.length > 0 ? `${Math.round(history[history.length - 1].timeTaken)}ms` : "0ms"}
                    icon={Activity}
                    description="Time per batch"
                />
                <StatsCard
                    title="Status"
                    value="Streaming"
                    icon={Cpu}
                />
            </div>

            {/* Chart Section */}
            <div className="bg-black border border-gray-800 rounded-lg p-6 h-[300px] min-w-0">
                <h2 className="text-xl font-semibold text-white mb-4">Calculation Performance</h2>
                <div className="w-full h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                            <XAxis dataKey="digits" stroke="#666" />
                            <YAxis stroke="#666" />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#000', border: '1px solid #333' }}
                                itemStyle={{ color: '#fff' }}
                            />
                            <Line type="monotone" dataKey="time" stroke="#fff" strokeWidth={2} dot={false} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Search Section */}
            <div className="bg-black border border-gray-800 rounded-lg p-6 space-y-4">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                    <Search size={20} /> Database Search
                </h2>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value.replace(/[^0-9]/g, ''))}
                        placeholder="Enter a number sequence..."
                        className="flex-1 bg-gray-900 border border-gray-700 rounded-md px-4 py-2 text-white focus:outline-none focus:border-white transition-colors font-mono"
                    />
                    <button
                        onClick={handleSearch}
                        disabled={isSearching}
                        className="px-6 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-700 border border-gray-700 transition-colors disabled:opacity-50"
                    >
                        {isSearching ? "Searching..." : "Find in DB"}
                    </button>
                </div>
                {searchResult && (
                    <div className={`p-4 rounded-md border ${searchResult.found ? 'bg-green-500/10 border-green-500/50 text-green-400' : 'bg-red-500/10 border-red-500/50 text-red-400'}`}>
                        {searchResult.found
                            ? `Sequence found at absolute position ${searchResult.index.toLocaleString()}!`
                            : "Sequence not found in the database yet."}
                    </div>
                )}
            </div>

            {/* Main Display */}
            <div className="bg-black border border-gray-800 rounded-lg p-1 overflow-hidden flex flex-col h-[500px]">
                <div className="p-4 border-b border-gray-800 bg-gray-900/50 flex justify-between items-center">
                    <span className="text-sm font-mono text-gray-400">pi-server-stream.db</span>
                    <span className="text-xs text-gray-600">Showing last {digits.length.toLocaleString()} digits</span>
                </div>

                <div className="flex-1 bg-black p-4 h-[400px]">
                    {digits.length > 0 ? (
                        <>
                            <div className="text-white font-bold text-2xl mb-2">3.</div>
                            <Virtuoso
                                ref={virtuosoRef}
                                style={{ height: '100%' }}
                                totalCount={Math.ceil(digits.length / 50)}
                                itemContent={Row}
                                followOutput={true}
                            />
                        </>
                    ) : (
                        <div className="text-gray-600 italic">Connecting to stream...</div>
                    )}
                </div>
            </div>

            {/* Footer */}
            <div className="text-center text-gray-500 text-sm pt-8 border-t border-gray-800">
                <p>Method: Unbounded Spigot Algorithm</p>
                <p className="mt-1">Made by Jeannn</p>
            </div>
        </div>
    );
}
