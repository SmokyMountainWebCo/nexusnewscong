import { NextRequest, NextResponse } from 'next/server';
import swarm from '../../../lib/swarm-core';

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();

    // Self-owned autonomous swarm handles everything
    const reply = await swarm.ask(message);

    // Security Swarm runs on every request
    await swarm.securityCheck();

    return NextResponse.json({ choices: [{ message: { content: reply } }] });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ choices: [{ message: { content: 'Swarm is online and defending. Try again in a moment.' } }] });
  }
}
